import crypto, { randomBytes } from "crypto";
import {
  User,
  LocalUser,
  RemoteUser,
  UserRelationship,
  RelationshipStatus,
  RelationshipType,
} from "@prisma/client";
import { Logger } from "log4js";

import {
  GetRelationshipsRequestDTO,
  SessionRequestDTO,
  SessionResponseDTO,
  SharedUserContextRequestDTO,
  SharedUserExchangeKeyRequest,
  SharedUserExchangeKeyRespond,
  RelationshipInfoDTO,
  SharedUserInitRemoteRequestDTO,
  SharedUserInitRequestDTO,
  SharedUserInitRespondDTO,
  SharedUserValidateRequest
} from "../models/shared-user.model.js";
import { UserRepository } from "../repositories/user.repository.js";
import { UserRelationshipRepository } from "../repositories/user-relationship.repository.js";
import { RemoteUserConnector } from "../connectors/remote-user.connector.js";
import { PublicUserResponseDTO } from "../models/user.model.js";
import { PhotoBlogError } from "../errors/photoblog.error.js";
import { generateFederatedAccessToken } from "../utils/jwt.util.js";

type UserWithLocal = User & { localUser: LocalUser };
type FullUserRelationship = UserRelationship & { fromUser: User & { remoteUser: RemoteUser | null, localUser: LocalUser | null }, toUser: User & { remoteUser: RemoteUser | null, localUser: LocalUser | null } };

export class SharedUserService {
  readonly DOCUMENT = '-Aureliano -dijo tristemente en el manipulador-, está lloviendo en Macondo.';

  constructor(
    private logger: Logger,
    private userRelationshipRepository: UserRelationshipRepository,
    private userRepository: UserRepository,
    private remoteUserConnector: RemoteUserConnector
  ) { }

  async getSharedUsers(userId: string, getRelationshipsRequest: GetRelationshipsRequestDTO) {
    const { name, email, status, direction } = getRelationshipsRequest;

    const relationships = await this.userRelationshipRepository.findUserRelationships(
      userId,
      getRelationshipsRequest.skip,
      getRelationshipsRequest.take,
      {
        status: status as RelationshipStatus,
        searchTerm: name || email,
      }
    );

    // Map to SharedUserInfo, determining direction
    const sharedUsersInfo = relationships.data.map(rel => {
      const isOutgoing = rel.fromUserId === userId;
      const otherUser = isOutgoing ? rel.toUser : rel.fromUser;
      return {
        id: rel.id,
        name: otherUser.name,
        email: otherUser.email,
        remoteAddress: otherUser.instanceUrl,
        status: rel.status,
        direction: isOutgoing ? 'Outgoing' : 'Incoming',
        comment: rel.comment,
      };
    }).filter(user => {
      if (!direction) return true;
      return user.direction.toUpperCase() === direction.toUpperCase();
    });

    return {
      data: sharedUsersInfo,
      pagination: relationships.pagination
    };
  }

  async fetchRemoteUsers(remoteAddress: string): Promise<PublicUserResponseDTO> {
    return this.remoteUserConnector.getRemoteUsers(remoteAddress);
  }

  async initiateRemoteRelationship(userId: string, sharedUserInitRequest: SharedUserInitRequestDTO): Promise<RelationshipInfoDTO> {
    const localUser = await this.getValidatedLocalUserById(userId);
    const { tempPublicKey, tempPrivateKey } = this.generateTempKeys();
    const requestBody = this.remoteUserConnector.buildInitRemoteRequestBody(localUser, sharedUserInitRequest.requestToUserInfo, tempPublicKey);

    const remoteResponse = await this.remoteUserConnector.sendRemoteSharingRequest(
      sharedUserInitRequest.requestToUserInfo.address,
      requestBody
    ) as SharedUserInitRespondDTO;

    if (!remoteResponse || !remoteResponse.requestFromUserInfo || !remoteResponse.requestToUserInfo) {
      throw new PhotoBlogError("Invalid response from remote user", 500);
    }

    const tempSymmetricKey = this.generateSharedSymmetricKey(tempPrivateKey, remoteResponse.tempPublicKey);
    this.logger.debug(`Generated temporary symmetric key.`);

    const remoteUserInfo = remoteResponse.requestToUserInfo;
    const remoteUser = await this.userRepository.upsertRemoteUser(
      remoteUserInfo.email,
      remoteUserInfo.name,
      remoteUserInfo.remoteAddress,
      { tempSymmetricKey }
    );

    const relationship = await this.userRelationshipRepository.createRelationship(
      localUser.id,
      remoteUser.id,
      RelationshipType.Share,
      sharedUserInitRequest.comment
    );

    return {
      id: relationship.id,
      name: remoteUser.name,
      email: remoteUser.email,
      remoteAddress: remoteUser.instanceUrl,
      status: relationship.status,
      direction: 'Outgoing',
      comment: relationship.comment || "",
    };
  }

  async receiveRemoteRelationshipRequest(sharedUserRequest: SharedUserInitRemoteRequestDTO): Promise<SharedUserInitRespondDTO> {
    const localUser = await this.userRepository.findLocalUserById(sharedUserRequest.requestToUserInfo.id);
    if (!localUser) {
      throw new PhotoBlogError("Local user not found", 404);
    }

    const { tempPublicKey, tempPrivateKey } = this.generateTempKeys();
    const tempSymmetricKey = this.generateSharedSymmetricKey(tempPrivateKey, sharedUserRequest.tempPublicKey);
    this.logger.debug(`Generated temporary symmetric key for incoming request.`);

    const remoteUserInfo = sharedUserRequest.requestFromUserInfo;
    const remoteUser = await this.userRepository.upsertRemoteUser(
      remoteUserInfo.email,
      remoteUserInfo.name,
      remoteUserInfo.remoteAddress,
      { tempSymmetricKey }
    );

    await this.userRelationshipRepository.createRelationship(
      remoteUser.id,
      localUser.id,
      RelationshipType.Share,
      sharedUserRequest.comment
    );

    return {
      requestFromUserInfo: { id: remoteUser.id },
      requestToUserInfo: {
        id: localUser.id,
        name: localUser.name,
        email: localUser.email,
        remoteAddress: localUser.instanceUrl,
      },
      tempPublicKey: tempPublicKey,
      timestamp: sharedUserRequest.timestamp,
    };
  }

  async approveSharingRequest(userId: string, relationshipId: string): Promise<RelationshipInfoDTO> {
    this.logger.info(`Approving relationship ${relationshipId} for user ${userId}`);
    const relationship = await this.userRelationshipRepository.findById(relationshipId);

    if (!relationship || relationship.toUserId !== userId) {
      throw new PhotoBlogError("Incoming relationship not found or user mismatch", 404);
    }
    if (relationship.status === RelationshipStatus.Active) {
      throw new PhotoBlogError("Relationship is already active", 400);
    }

    const localUser = await this.getValidatedLocalUserById(userId);
    const remoteUser = relationship.fromUser;

    // For remote users, perform the secure key exchange. For local users, just activate.
    if (remoteUser.type === 'Remote') {
       if (relationship.status === RelationshipStatus.Pending) {
        await this.exchangeKeys(localUser, relationship as FullUserRelationship);
        await this.validateKeys(localUser, relationship as FullUserRelationship);
      }
    }

    const updatedRel = await this.userRelationshipRepository.updateRelationshipStatus(relationshipId, RelationshipStatus.Active);
    
    return {
      id: updatedRel.id,
      name: remoteUser.name,
      email: remoteUser.email,
      remoteAddress: remoteUser.instanceUrl,
      status: updatedRel.status,
      direction: 'Incoming',
      comment: updatedRel.comment || "",
    };
  }

  async blockRelationship(userId: string, relationshipId: string): Promise<RelationshipInfoDTO> {
    const relationship = await this.userRelationshipRepository.findById(relationshipId);
    if (!relationship || (relationship.fromUserId !== userId && relationship.toUserId !== userId)) {
      throw new PhotoBlogError("Relationship not found for this user", 404);
    }
    if (relationship.status === RelationshipStatus.Blocked) {
      throw new PhotoBlogError("Relationship is already blocked", 400);
    }

    const updatedRel = await this.userRelationshipRepository.updateRelationshipStatus(relationshipId, RelationshipStatus.Blocked);
    const isOutgoing = updatedRel.fromUserId === userId;
    const otherUser = isOutgoing ? updatedRel.toUser : updatedRel.fromUser;

    return {
      id: updatedRel.id,
      name: otherUser.name,
      email: otherUser.email,
      remoteAddress: otherUser.instanceUrl,
      status: updatedRel.status,
      direction: isOutgoing ? 'Outgoing' : 'Incoming',
      comment: updatedRel.comment || "",
    };
  }

  async exchangeRemotePublicKey(req: SharedUserExchangeKeyRequest): Promise<SharedUserExchangeKeyRespond> {
    const localUserId = req.requestToUserInfo.id;
    const remoteUserId = req.requestFromUserInfo.id;

    const { localUser, remoteUser } = await this.findPendingRelationship(remoteUserId, localUserId);
    if (!remoteUser.remoteUser?.tempSymmetricKey) {
      throw new PhotoBlogError("Temporary symmetric key not found for remote user", 500);
    }

    const decryptedPublicKey = this.decryptPublicKey(remoteUser.remoteUser.tempSymmetricKey, req.encryptedPublicKey);
    await this.userRepository.updateRemoteUser(remoteUser.id, { publicKey: decryptedPublicKey });

    const encryptedPublicKey = this.createCipherivPublicKey(remoteUser.remoteUser.tempSymmetricKey, localUser.localUser.publicKey);
    const signature = this.createSignature(localUser.localUser.privateKey);

    return {
      requestFromUserInfo: { id: localUser.id },
      requestToUserInfo: { id: remoteUser.id },
      encryptedPublicKey,
      signature,
      timestamp: req.timestamp,
    };
  }

  async validateRemotePublicKey(req: SharedUserValidateRequest): Promise<void> {
    const localUserId = req.requestToUserInfo.id;
    const remoteUserId = req.requestFromUserInfo.id;

    const { remoteUser, relationship } = await this.findPendingRelationship(remoteUserId, localUserId);
    if (!remoteUser.remoteUser?.publicKey) {
      throw new PhotoBlogError("Remote user public key not found", 500);
    }

    const isValid = this.validSignature(remoteUser.remoteUser.publicKey, req.signature);
    if (!isValid) {
      throw new PhotoBlogError("Validate remote user's signature failed", 500);
    }

    await this.userRelationshipRepository.updateRelationshipStatus(relationship.id, RelationshipStatus.Active);
  }

  async getSession(sessionRequest: SessionRequestDTO): Promise<SessionResponseDTO> {
    const localUser = await this.userRepository.findLocalUserById(sessionRequest.requestToUserInfo.id);
    const remoteUser = await this.userRepository.findById(sessionRequest.requestFromUserInfo.id);

    if (!localUser || !remoteUser || !remoteUser.remoteUser) {
      throw new PhotoBlogError('User not found or remote user data is missing', 404);
    }

    const relationship = await this.userRelationshipRepository.findRelationship(remoteUser.id, localUser.id);
    if (!relationship || relationship.status !== RelationshipStatus.Active) {
      throw new PhotoBlogError('Active relationship not found', 403);
    }

    if (!remoteUser.remoteUser.publicKey) {
      throw new PhotoBlogError('Remote user public key is missing. Cannot establish session.', 500);
    }

    const isValid = this.validSignature(remoteUser.remoteUser.publicKey, sessionRequest.signature);
    if (!isValid) {
      throw new PhotoBlogError("Validate signature failed", 500);
    }

    const session = randomBytes(16).toString("hex");
    this.logger.debug(`Session ${session} created for remote user ${remoteUser.id}`);
    const encryptedSession = this.createPublicEncryptedSession(remoteUser.remoteUser.publicKey, session);
    
    const accessToken = generateFederatedAccessToken(localUser, session);

    return { accessToken, session: encryptedSession };
  }

  public async requestSharedUser(userId: string, sharedUserContextRequest: SharedUserContextRequestDTO) {
    const localUser = await this.getValidatedLocalUserById(userId);
    const remoteUserId = sharedUserContextRequest.requestToUserInfo.id;

    const relationship = await this.userRelationshipRepository.findRelationship(localUser.id, remoteUserId);
    if (!relationship || relationship.status !== RelationshipStatus.Active || !relationship.toUser.remoteUser) {
      throw new PhotoBlogError("Active relationship with remote user not found", 403);
    }

    const remoteUser = relationship.toUser as User & { remoteUser: RemoteUser };
    const { accessToken } = await this.updateTokenValidity(localUser, remoteUser);
    this.logger.debug(`Using access token for remote request: ${accessToken}`);

    sharedUserContextRequest.requestHeaders = {
      ...sharedUserContextRequest.requestHeaders,
      "Authorization": `Bearer ${accessToken}`,
    };
    
    return await this.remoteUserConnector.proxyRequestToRemote(
      remoteUser.instanceUrl,
      sharedUserContextRequest
    );
  }

  private async findPendingRelationship(fromUserId: string, toUserId: string) {
    const relationship = await this.userRelationshipRepository.findRelationship(fromUserId, toUserId);
    if (!relationship || relationship.status !== RelationshipStatus.Pending) {
      throw new PhotoBlogError("Pending relationship not found", 404);
    }

    const localUser = relationship.toUser;
    const remoteUser = relationship.fromUser;

    if (!localUser.localUser || !remoteUser.remoteUser) {
      throw new PhotoBlogError("User data is incomplete for this relationship", 500);
    }

    return { localUser: localUser as UserWithLocal, remoteUser, relationship };
  }

  private async updateTokenValidity(localUser: UserWithLocal, remoteUser: User & { remoteUser: RemoteUser }) {
    const remoteUserDetails = remoteUser.remoteUser;
    if (!remoteUserDetails.accessToken || !remoteUserDetails.accessTokenExpireTime || this.isTokenExpired(remoteUserDetails.accessTokenExpireTime) || !remoteUserDetails.session) {
      const signature = this.createSignature(localUser.localUser.privateKey);
      const sessionRequest: SessionRequestDTO = this.remoteUserConnector.buildSessionRequestBody(localUser, remoteUser.id, signature);
      const sessionRespond = await this.remoteUserConnector.getSession(remoteUser.instanceUrl, sessionRequest);
      this.logger.debug(`Session response: ${JSON.stringify(sessionRespond)}`);

      const decryptedSession = this.decryptSession(localUser.localUser.privateKey, sessionRespond.session);
      
      await this.userRepository.updateRemoteUser(remoteUser.id, {
        accessToken: sessionRespond.accessToken.token,
        accessTokenExpireTime: new Date(sessionRespond.accessToken.expiresAt),
        session: decryptedSession,
      });

      return {
        accessToken: sessionRespond.accessToken.token,
        session: decryptedSession
      };
    }
    return {
      accessToken: remoteUserDetails.accessToken,
      session: remoteUserDetails.session
    };
  }

  private isTokenExpired(expireTime: Date | null): boolean {
    if (!expireTime) {
      return true;
    }
    return expireTime.getTime() < Date.now();
  }

  private generateTempKeys(): { tempPublicKey: string; tempPrivateKey: string } {
    const tempKeyPair = crypto.generateKeyPairSync('x25519');
    const tempPublicKey = tempKeyPair.publicKey.export({ type: 'spki', format: 'pem' }).toString('utf8');
    const tempPrivateKey = tempKeyPair.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString('utf8');
    return { tempPublicKey, tempPrivateKey };
  }

  private generateSharedSymmetricKey(tempPrivateKey: string, remotePublicKey: string): string {
    const privateKey = crypto.createPrivateKey({ key: tempPrivateKey, format: "pem" });
    const publicKey = crypto.createPublicKey({ key: remotePublicKey, format: "pem" });
    const sharedSecret = crypto.diffieHellman({ privateKey, publicKey });
    return crypto.createHash("sha256").update(sharedSecret).digest("base64");
  }

  private async exchangeKeys(localUser: UserWithLocal, relationship: FullUserRelationship) {
    const remoteUser = relationship.fromUser;
    if (!remoteUser.remoteUser?.tempSymmetricKey) {
      throw new PhotoBlogError("Temp symmetric key not found", 500);
    }

    const encryptedUserPublicKey = this.createCipherivPublicKey(remoteUser.remoteUser.tempSymmetricKey, localUser.localUser.publicKey);
    const requestBody = this.remoteUserConnector.buildExchangeKeyRequestBody(localUser, remoteUser, encryptedUserPublicKey);

    const response = await this.remoteUserConnector.exchangeEncryptedPublicKey(
      remoteUser.instanceUrl,
      requestBody
    ) as SharedUserExchangeKeyRespond;

    const decryptedResponsePublicKey = this.decryptPublicKey(remoteUser.remoteUser.tempSymmetricKey, response.encryptedPublicKey);
    const isValid = this.validSignature(decryptedResponsePublicKey, response.signature);
    if (!isValid) {
      throw new PhotoBlogError("Validate signature from remote user failed", 500);
    }

    await this.userRepository.updateRemoteUser(remoteUser.id, { publicKey: decryptedResponsePublicKey });
    this.logger.info(`Key exchange completed for relationship ${relationship.id}`);
  }

  private async validateKeys(localUser: UserWithLocal, relationship: FullUserRelationship) {
    const remoteUser = relationship.fromUser;
    const signature = this.createSignature(localUser.localUser.privateKey);
    const requestBody = this.remoteUserConnector.buildValidateKeyRequestBody(localUser, remoteUser, signature);
    await this.remoteUserConnector.validateRemotePublicKey(remoteUser.instanceUrl, requestBody);
    this.logger.info(`Key validation completed for relationship ${relationship.id}`);
  }

  private createSignature(userPrivateKey: string) {
    return crypto.createSign("SHA256").update(this.DOCUMENT).sign(userPrivateKey, "hex");
  }

  private validSignature(publicKey: string, signature: string) {
    return crypto.createVerify("SHA256").update(this.DOCUMENT).verify(publicKey, signature, "hex");
  }

  private createCipherivPublicKey(symmetricKey: string, publicKey: string) {
    const keyBuffer = Buffer.from(symmetricKey, 'base64');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", keyBuffer, iv);
    let encrypted = cipher.update(publicKey, "utf-8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString('hex') + encrypted;
  }

  private decryptPublicKey(symmetricKey: string, encryptedPublicKey: string): string {
    const keyBuffer = Buffer.from(symmetricKey, 'base64');
    const iv = Buffer.from(encryptedPublicKey.slice(0, 32), 'hex');
    const encryptedData = encryptedPublicKey.slice(32);
    const decipher = crypto.createDecipheriv("aes-256-cbc", keyBuffer, iv);
    let decrypted = decipher.update(encryptedData, "hex", "utf-8");
    decrypted += decipher.final("utf-8");
    return decrypted;
  }

  private createPublicEncryptedSession(publicKey: string, session: string) {
    return crypto.publicEncrypt(publicKey, Buffer.from(session)).toString("base64");
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

  private async getValidatedLocalUserById(userId: string): Promise<UserWithLocal> {
    const user = await this.userRepository.findLocalUserById(userId);
    if (!user || !user.localUser) {
      throw new PhotoBlogError('Local user not found or data incomplete', 404);
    }
    return user as UserWithLocal;
  }
}
