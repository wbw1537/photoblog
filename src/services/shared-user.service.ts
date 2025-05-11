import crypto, { randomBytes } from "crypto";
import { Prisma, SharedUser, SharedUserDirection, SharedUserStatus, User } from "@prisma/client";

import { SessionRequestDTO, SessionResponseDTO, SharedUserContextRequestDTO, SharedUserExchangeKeyRequest, SharedUserExchangeKeyRespond, SharedUserInfo, SharedUserInitRemoteRequestDTO , SharedUserInitRequestDTO, SharedUserInitRespondDTO, SharedUserRequest, SharedUserValidateRequest } from "../models/shared-user.model.js";
import { SharedUserRepository } from "../repositories/shared-user.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { SharedUserConnector } from "../connectors/shared-user.connector.js";
import { PublicUserResponseDTO } from "../models/user.model.js";
import { PhotoBlogError } from "../errors/photoblog.error.js";
import { generateAccessTokenForSharedUser } from "../utils/jwt.util.js";
import { Logger } from "log4js";

export class SharedUserService {
  readonly DOCUMENT = '-Aureliano -dijo tristemente en el manipulador-, está lloviendo en Macondo.';

  constructor(
    private logger: Logger,
    private sharedUserRepository: SharedUserRepository,
    private userRepository: UserRepository,
    private sharedUserConnector: SharedUserConnector
  ) {}

  async getSharedUsers(userId: string, sharedUserRequest: SharedUserRequest) {
    const whereInput = this.buildWhereInput(userId, sharedUserRequest);
    return await this.sharedUserRepository.findAllByFilter(sharedUserRequest.skip, sharedUserRequest.take, whereInput);
  }

  async fetchRemoteUsers(remoteAddress: string): Promise<PublicUserResponseDTO> {
    // Fetch all remote users
    const remoteUsers = await this.sharedUserConnector.getRemoteUsers(remoteAddress);
    return remoteUsers;
  }

  async initSharingRequest(userId: string, sharedUserInitRequest: SharedUserInitRequestDTO) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new PhotoBlogError("User not found", 404);
    }
    const { tempPublicKey, tempPrivateKey } = this.generateTempKeys();
    this.logger.debug(`tempPublicKey: ${tempPublicKey}`);
    this.logger.debug(`tempPrivateKey: ${tempPrivateKey}`);
    const requestBody = this.sharedUserConnector.buildInitRemoteRequestBody(user, sharedUserInitRequest, tempPublicKey);
    const remoteResponse = await this.sharedUserConnector.sendRemoteSharingRequest(
      sharedUserInitRequest.requestToUserInfo.address,
      requestBody
    ) as SharedUserInitRespondDTO;
    if (!remoteResponse || !remoteResponse.requestFromUserInfo || !remoteResponse.requestToUserInfo) {
      throw new PhotoBlogError("Invalid response from remote user", 500);
    }
    const sharedUserTempSymmetricKey = this.generateSharedSymmetricKey(
      tempPrivateKey,
      remoteResponse.tempPublicKey
    );
    this.logger.debug(`sharedUserTempSymmetricKey: ${sharedUserTempSymmetricKey}`);
    // Create a response object
    const sharedUser = await this.sharedUserRepository.createOutgoingSharedUser(
      remoteResponse,
      sharedUserTempSymmetricKey
    );
    const response: SharedUserInfo = {
      id: sharedUser.id,
      name: sharedUser.sharedUserName,
      email: sharedUser.sharedUserEmail,
      remoteAddress: sharedUser.sharedUserAddress,
      status: sharedUser.status,
      direction: sharedUser.direction,
      comment: sharedUser.comment,
    }
    return response;
  }

  async initRemoteSharingRequest(sharedUserRequest: SharedUserInitRemoteRequestDTO): Promise<SharedUserInitRespondDTO> {
    // check if the user exists
    const user = await this.userRepository.findById(sharedUserRequest.requestToUserInfo.id);
    if (!user) {
      throw new PhotoBlogError("User not found", 404);
    }
    // Generate a temporary public key and private key
    const { tempPublicKey, tempPrivateKey } = this.generateTempKeys();
    this.logger.debug(`tempPublicKey: ${tempPublicKey}`);
    this.logger.debug(`tempPrivateKey: ${tempPrivateKey}`);
    // Use DHKE to generate a shared symmetric key
    const sharedUserTempSymmetricKey = this.generateSharedSymmetricKey(
      tempPrivateKey,
      sharedUserRequest.tempPublicKey
    );
    this.logger.debug(`sharedUserTempSymmetricKey: ${sharedUserTempSymmetricKey}`);
    // Create a new shared user in the database
    await this.sharedUserRepository.createIncomingSharedUser(
      sharedUserRequest,
      sharedUserTempSymmetricKey
    );
    // Create a response object
    const response: SharedUserInitRespondDTO = {
      requestFromUserInfo: {
        id: sharedUserRequest.requestFromUserInfo.id,
      },
      requestToUserInfo: {
        id: user.id,
        name: user.name,
        email: user.email,
        remoteAddress: user.address,
      },
      tempPublicKey: tempPublicKey,
      timestamp: sharedUserRequest.timestamp,
    };
    return response;
  }

  async setSharedUserActive(userId: string, sharedUserId: string) {
    // Check if the user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new PhotoBlogError("User not found", 404);
    }
    // Check if the shared user exists
    const sharedUser = await this.sharedUserRepository.findBySharedUserId(userId, sharedUserId);
    if (!sharedUser) {
      throw new PhotoBlogError("Shared user not found", 404);
    }
    // Check if direction is incoming
    if (sharedUser.direction !== SharedUserDirection.Incoming) {
      throw new PhotoBlogError("Shared user direction is not incoming", 400);
    }
    // Check if current status is already active
    if (sharedUser.status === SharedUserStatus.Active) {
      throw new PhotoBlogError("Shared user is already active", 400);
    }
    if (sharedUser.status === SharedUserStatus.Pending) {
      // Trigger key exchange and key validation
      await this.exchangeKeys(user, sharedUser);
      await this.validateKeys(user, sharedUser);
    }
    // Update the shared user status to active
    return await this.sharedUserRepository.activateSharedUser(
      sharedUser.id
    );
  }

  async exchangeRemotePublicKey(sharedUserExchangeKeyRequest: SharedUserExchangeKeyRequest) {
    const { user, sharedUser } = await this.checkSharedUserPendingStatus(
      sharedUserExchangeKeyRequest.requestFromUserInfo.id,
      sharedUserExchangeKeyRequest.requestToUserInfo.id
    );
    // Decrypt the shared user's public key
    const sharedUserTempSymmetricKey = sharedUser.sharedUserTempSymmetricKey;
    const decryptedPublicKey = this.decryptPublicKey(
      sharedUserTempSymmetricKey, sharedUserExchangeKeyRequest.encryptedPublicKey
    )
    // Store the decrypted public key in the database
    await this.sharedUserRepository.updateSharedUserPublicKey(
      sharedUser.id,
      decryptedPublicKey
    );
    // Encrypt the user's public key with the shared user's symmetric key
    const encryptedPublicKey = this.createCipherivPublicKey(
      sharedUserTempSymmetricKey, user.publicKey
    );
    // Use user's private key to make a signature
    const signature = this.createSignature(user.privateKey);
    // Create a response object
    // The response includes the encrypted public key and the signature
    // The signature is made by the user's private key
    // Shared user should use the user's public key to verify the signature
    const response: SharedUserExchangeKeyRespond = {
      requestFromUserInfo: {
        id: user.id,
      },
      requestToUserInfo: {
        id: sharedUser.id,
      },
      encryptedPublicKey: encryptedPublicKey,
      signature: signature,
      timestamp: sharedUserExchangeKeyRequest.timestamp,
    }
    return response;
  }

  async validateRemotePublicKey(sharedUserValidateRequest: SharedUserValidateRequest) {
    const { sharedUser } = await this.checkSharedUserPendingStatus(
      sharedUserValidateRequest.requestFromUserInfo.id,
      sharedUserValidateRequest.requestToUserInfo.id
    );
    // The received signature is made by the shared user's private key
    // Use the shared user's public key to verify the signature
    const isValid = this.validSignature(
      sharedUser.sharedUserPublicKey,
      sharedUserValidateRequest.signature
    )
    if (!isValid) {
      throw new PhotoBlogError("Validate shared user's signature failed", 500);
    }
    // Activate the shared user
    await this.sharedUserRepository.activateSharedUser(sharedUser.id);
  }


  async getSession(sessionRequest: SessionRequestDTO): Promise<SessionResponseDTO> {
    // Check if the user exists
    const user = await this.userRepository.findById(sessionRequest.requestToUserInfo.id);
    if (!user) {
      throw new PhotoBlogError('User not found', 404);
    }
    // Check if the remote user exists
    const sharedUser = await this.sharedUserRepository.findBySharedUserId(user.id, sessionRequest.requestFromUserInfo.id);
    if (!sharedUser) {
      throw new PhotoBlogError('Shared user not found', 404);
    }
    // Check if the sharing status is Active
    if (sharedUser.status !== SharedUserStatus.Active) {
      throw new PhotoBlogError('Shared user is not active', 403);
    }
    // Validate the signature
    const isValid = this.validSignature(
      sharedUser.sharedUserPublicKey,
      sessionRequest.signature
    );
    if (!isValid) {
      throw new PhotoBlogError("Validate shared user's signature failed", 500);
    }
    // Create a session token, random string encrypted by the shared user's public key
    const session = randomBytes(16).toString("hex");
    const encryptedSession = this.createPublicEncryptedSession(sharedUser.sharedUserPublicKey, session);
    // Create access token and refresh token for the user
    const userWithSession = {
      ...user,
      session: encryptedSession,
    }
    const accessToken = generateAccessTokenForSharedUser(userWithSession, sharedUser.sharedUserPublicKey);
    // Create a response object
    const response: SessionResponseDTO = {
      accessToken: accessToken,
      session: encryptedSession
    }
    return response;
  }

  public async requestSharedUser(userId: string, sharedUserContextRequest: SharedUserContextRequestDTO) {
    // Check if the shared user exists
    const sharedUser = await this.sharedUserRepository.findBySharedUserId(userId, sharedUserContextRequest.requestToUserInfo.id);
    if (!sharedUser) {
      throw new PhotoBlogError("Shared user not found", 404);
    }
    // Get User private key
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new PhotoBlogError("User not found", 404);
    }
    // Check if the sharing status is Active
    if (sharedUser.status !== SharedUserStatus.Active) {
      throw new PhotoBlogError("Shared user is not active", 403);
    }
    const {accessToken, session} = 
      await this.updateTokenValidity(user, sharedUser);
    
    sharedUserContextRequest.requestHeaders = {
      ...sharedUserContextRequest.requestHeaders,
      "Authorization": `Bearer ${accessToken}`,
    }
    // const encryptedBody = this.createSessionEncryptedBody(session, sharedUserContextRequest.requestBody);
    // sharedUserContextRequest.requestBody = encryptedBody;
    // Send the request to the shared user
    const encryptedBase64 = await this.sharedUserConnector.requestSharedUser(
      sharedUser.sharedUserAddress,
      sharedUserContextRequest
    );
    // Decrypt the response body
    const decryptedResponse = this.decryptSession(session, encryptedBase64);
    return decryptedResponse;
  }

  private async checkSharedUserPendingStatus(userId: string, sharedUserId: string) {
    // Check if the user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new PhotoBlogError("User not found", 404);
    }
    // Check if the shared user exists
    const sharedUser = await this.sharedUserRepository.findBySharedUserId(
      user.id,
      sharedUserId
    );
    if (!sharedUser) {
      throw new PhotoBlogError("Shared user not found", 404);
    }
    // Check if direction is outgoing
    if (sharedUser.direction !== SharedUserDirection.Outgoing) {
      throw new PhotoBlogError("Shared user direction is not outgoing", 400);
    }
    // Check if current status is pending
    if (sharedUser.status !== SharedUserStatus.Pending) {
      throw new PhotoBlogError("Shared user is not pending", 400);
    }
    return { user, sharedUser };
  }

  private generateTempKeys(): { tempPublicKey: string; tempPrivateKey: string } {
    // Generate a pair of x25519 keys
    const tempKeyPair = crypto.generateKeyPairSync('x25519');

    // Export the keys as PEM strings
    const tempPublicKey = tempKeyPair.publicKey.export({ type: 'spki', format: 'pem' }).toString('utf8');
    const tempPrivateKey = tempKeyPair.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString('utf8');
    return { tempPublicKey, tempPrivateKey };
  }

  private generateSharedSymmetricKey(tempPrivateKey: string, remotePublicKey: string): string {
    // Convert keys from PEM format to buffers
    const privateKey = crypto.createPrivateKey({ key: tempPrivateKey, format: "pem" });
    const publicKey = crypto.createPublicKey({ key: remotePublicKey, format: "pem" });

    // Derive a shared secret using ECDH (Elliptic Curve Diffie-Hellman)
    const sharedSecret = crypto.diffieHellman({
      privateKey,
      publicKey,
    });

    // Hash the shared secret to generate a symmetric key
    const symmetricKey = crypto.createHash("sha256").update(sharedSecret).digest("hex");

    return symmetricKey;
  }

  private buildWhereInput(userId: string, sharedUserRequest: SharedUserRequest) {
    const {
      name,
      email,
      remoteAddress,
      status,
      direction,
    } = sharedUserRequest;

    const whereInput: Prisma.SharedUserWhereInput = {
      userId: userId,
      sharedUserEmail: email,
      sharedUserName: name,
      sharedUserAddress: remoteAddress,
      status: status,
      direction: direction,
    }
    // Remove any undefined properties in whereInput to avoid issues with Prisma queries
    Object.keys(whereInput).forEach(
      (key) => (whereInput as never)[key] === undefined && delete (whereInput as never)[key]
    );
    return whereInput;
  }

  private async exchangeKeys(user: User, sharedUser: SharedUser) {
    // Encrypt the user's public key with the shared user's symmetric key
    const userPublicKey = user.publicKey;
    const sharedUserTempSymmetricKey = sharedUser.sharedUserTempSymmetricKey;
    const encryptedUserPublicKey = this.createCipherivPublicKey(
      sharedUserTempSymmetricKey, userPublicKey
    );
    const requestBody = this.sharedUserConnector.buildExchangeKeyRequestBody(user, sharedUser, encryptedUserPublicKey);
    // A signature is included in the response
    // The signature is made by the shared user's private key
    // Use the shared user's public key to verify the signature
    const response = await this.sharedUserConnector.exchangeEncryptedPublicKey(
      sharedUser.sharedUserAddress,
      requestBody
    ) as SharedUserExchangeKeyRespond;
    const decryptedResponsePublicKey = crypto
      .createDecipheriv("aes-256-cbc", sharedUserTempSymmetricKey, Buffer.alloc(16, 0))
      .update(response.encryptedPublicKey, "hex", "utf-8");
    const isValid = this.validSignature(decryptedResponsePublicKey, response.signature);
    if (!isValid) {
      throw new PhotoBlogError("Validate shared user's signature failed", 500);
    }
    await this.sharedUserRepository.updateSharedUserPublicKey(
      sharedUser.id,
      decryptedResponsePublicKey
    );
  }

  private async validateKeys(user: User, sharedUser: SharedUser) {
    // Create the signature using the user's private key
    const userPrivateKey = user.privateKey;
    const signature = this.createSignature(userPrivateKey);
    const requestBody = this.sharedUserConnector.buildValidateKeyRequestBody(user, sharedUser, signature);
    await this.sharedUserConnector.validateRemotePublicKey(
      sharedUser.sharedUserAddress,
      requestBody
    );
  }

  private createSignature(userPrivateKey: string) {
    return crypto
      .createSign("SHA256")
      .update(this.DOCUMENT)
      .sign(userPrivateKey, "hex");
  }

  private createCipherivPublicKey(sharedUserTempSymmetricKey: string, userPublicKey: string) {
    return crypto
      .createCipheriv("aes-256-cbc", sharedUserTempSymmetricKey, Buffer.alloc(16, 0))
      .update(userPublicKey, "utf-8", "hex");
  }

  private decryptPublicKey(sharedUserTempSymmetricKey: string, encryptedPublicKey: string) {
    return crypto
      .createDecipheriv("aes-256-cbc", sharedUserTempSymmetricKey, Buffer.alloc(16, 0))
      .update(encryptedPublicKey, "hex", "utf-8");
  }

  private validSignature(publicKey: string, signature: string) {
    return crypto
      .createVerify("SHA256")
      .update(this.DOCUMENT)
      .verify(publicKey, signature, "hex");
  }

  private createPublicEncryptedSession(publicKey: string, session: string) {
    return crypto
      .publicEncrypt(publicKey, Buffer.from(session))
      .toString("hex");
  }

  private decryptSession(userPrivateKey: string, session: string): string {
    return crypto.privateDecrypt(
      {
        key: userPrivateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      },
      Buffer.from(session, "base64")
    ).toString("utf-8");
  }

  private decryptResponse(session: string, encryptedResponse: string) {
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(session), Buffer.alloc(16, 0));
    let decrypted = decipher.update(encryptedResponse, "hex", "utf-8");
    decrypted += decipher.final("utf-8");
    return decrypted;
  }

  private createSessionEncryptedBody(session: string, body: object) {
    const iv = randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(session), iv);
    let encrypted = cipher.update(JSON.stringify(body), "utf-8", "hex");
    encrypted += cipher.final("hex");
    return { iv: iv.toString("hex"), encryptedData: encrypted };
  }

  private async updateTokenValidity(user: User, sharedUser: SharedUser) {
    if (!sharedUser.accessToken || this.isTokenExpired(sharedUser.accessTokenExpireTime) || !sharedUser.session) {
      const signature = this.createSignature(user.privateKey);
      const sessionRequest: SessionRequestDTO = this.sharedUserConnector.buildSessionRequestBody(user, sharedUser.id, signature);
      const sessionRespond = await this.sharedUserConnector.getSession(sharedUser.sharedUserAddress, sessionRequest);
      const decryptedSession = this.decryptSession(user.privateKey, sessionRespond.session);
      sessionRespond.session = decryptedSession;
      await this.sharedUserRepository.updateTokenAndSession(sharedUser, sessionRespond)
      return {
        accessToken: sessionRespond.accessToken.token,
        session: sessionRespond.session
      }
    }
    return {
      accessToken: sharedUser.accessToken,
      session: sharedUser.session
    }
  }

  private isTokenExpired(expireTime: Date | null): boolean {
    if (!expireTime) {
      return false;
    }
    if (expireTime.getTime() < Date.now()) {
      return true;
    }
    return false;
  }
}