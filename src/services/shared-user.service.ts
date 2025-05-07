import crypto from "crypto";
import { Prisma, SharedUser, SharedUserDirection, SharedUserStatus, User } from "@prisma/client";

import { SharedUserExchangeKeyRespond, SharedUserInitRemoteRequestDTO , SharedUserInitRequestDTO, SharedUserInitRespondDTO, SharedUserRequest } from "../models/shared-user.model.js";
import { SharedUserRepository } from "../repositories/shared-user.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { SharedUserConnector } from "../connectors/shared-user.connector.js";
import { PublicUsersResponseDTO } from "../models/user.model.js";
import { PhotoBlogError } from "../errors/photoblog.error.js";

export class SharedUserService {
  readonly DOCUMENT = 'Aureliano -dijo tristemente el manipulador-, está lloviendo en Macondo.';

  constructor(
    private sharedUserRepository: SharedUserRepository,
    private userRepository: UserRepository,
    private sharedUserConnector: SharedUserConnector
  ) {}

  async getSharedUsers(userId: string, sharedUserRequest: SharedUserRequest) {
    const whereInput = this.buildWhereInput(userId, sharedUserRequest);
    return await this.sharedUserRepository.findAllByFilter(sharedUserRequest.skip, sharedUserRequest.take, whereInput);
  }

  async fetchRemoteUsers(remoteAddress: string): Promise<PublicUsersResponseDTO> {
    // Fetch all remote users from the database
    const remoteUsers = await this.sharedUserConnector.getRemoteUsers(remoteAddress);
    return remoteUsers;
  }

  async initSharingRequest(userId: string, sharedUserInitRequest: SharedUserInitRequestDTO): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new PhotoBlogError("User not found", 404);
    }
    const { tempPublicKey, tempPrivateKey } = this.generateTempKeys();
    const requestBody = await this.sharedUserConnector.buildInitRemoteRequestBody(user, sharedUserInitRequest, tempPublicKey);
    try {
      const response = await this.sharedUserConnector.sendRemoteSharingRequest(
        sharedUserInitRequest.requestToUserInfo.address,
        requestBody
      ) as SharedUserInitRespondDTO;
      if (!response || !response.requestFromUserInfo || !response.requestToUserInfo) {
        throw new PhotoBlogError("Invalid response from remote user", 500);
      }
      const sharedUserTempSymmetricKey = this.generateSharedSymmetricKey(
        tempPrivateKey,
        response.tempPublicKey
      );
      await this.sharedUserRepository.createOutgoingSharedUser(
        response,
        sharedUserTempSymmetricKey
      );
    } catch (error) {
      throw new PhotoBlogError(`Failed to send remote sharing request: ${error}`, 500);
    }
  }

  async initRemoteSharingRequest(sharedUserRequest: SharedUserInitRemoteRequestDTO): Promise<SharedUserInitRespondDTO> {
    // check if the user exists
    const user = await this.userRepository.findById(sharedUserRequest.requestFromUserInfo.id);
    if (!user) {
      throw new PhotoBlogError("User not found", 404);
    }
    // Generate a temporary public key and private key
    const { tempPublicKey, tempPrivateKey } = this.generateTempKeys();
    // Use DHKE to generate a shared symmetric key
    const sharedUserTempSymmetricKey = this.generateSharedSymmetricKey(
      tempPrivateKey,
      sharedUserRequest.tempPublicKey
    );
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
    const sharedUser = await this.sharedUserRepository.findById(userId, sharedUserId);
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
      await this.validateRemotePublicKey(user, sharedUser);
    }
    // Update the shared user status to active
    return await this.sharedUserRepository.activateSharedUser(
      sharedUser.id
    );
  }

  private generateTempKeys(): { tempPublicKey: string; tempPrivateKey: string } {
    // Generate a pair of RSA keys
    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
    });

    // Export the keys as PEM strings
    const tempPublicKey = publicKey.export({ type: "pkcs1", format: "pem" }).toString();
    const tempPrivateKey = privateKey.export({ type: "pkcs1", format: "pem" }).toString();

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
    const userPublicKey = user.publicKey;
    const sharedUserTempSymmetricKey = sharedUser.sharedUserTempSymmetricKey;
    const encryptedUserPublicKey = crypto
      .createCipheriv("aes-256-cbc", sharedUserTempSymmetricKey, Buffer.alloc(16, 0))
      .update(userPublicKey, "utf-8", "hex");
    const requestBody = await this.sharedUserConnector.buildExchangeKeyRequestBody(user, sharedUser, encryptedUserPublicKey);
    const response = await this.sharedUserConnector.exchangeEncryptedPublicKey(
      sharedUser.sharedUserAddress,
      requestBody
    ) as SharedUserExchangeKeyRespond;
    const decryptedResponsePublicKey = crypto
      .createDecipheriv("aes-256-cbc", sharedUserTempSymmetricKey, Buffer.alloc(16, 0))
      .update(response.encryptedPublicKey, "hex", "utf-8");
    const isValid = crypto
      .createVerify("SHA256")
      .update(this.DOCUMENT)
      .verify(decryptedResponsePublicKey, response.signature, "hex");
    if (!isValid) {
      throw new PhotoBlogError("Validate shared user's signature failed", 500);
    }
    await this.sharedUserRepository.updateSharedUserPublicKey(
      sharedUser.id,
      decryptedResponsePublicKey
    );
  }

  private async validateRemotePublicKey(user: User, sharedUser: SharedUser) {
    const userPrivateKey = user.privateKey;
    const signature = crypto
      .createSign("SHA256")
      .update(this.DOCUMENT)
      .sign(userPrivateKey, "hex");
    const requestBody = await this.sharedUserConnector.buildValidateKeyRequestBody(user, sharedUser, signature);
    await this.sharedUserConnector.validateRemotePublicKey(
      sharedUser.sharedUserAddress,
      requestBody
    );
  }
}