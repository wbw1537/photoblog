import crypto from "crypto";
import { Prisma } from "@prisma/client";


import { SharedUserInitRemoteRequestDTO , SharedUserInitRequestDTO, SharedUserInitRespondDTO, SharedUserRequest} from "../models/shared-user.model.js";
import { SharedUserRepository } from "../repositories/shared-user.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { SharedUserConnector } from "../connectors/shared-user.connector.js";
import { PublicUsersResponseDTO } from "../models/user.model.js";
import { PhotoBlogError } from "../errors/photoblog.error.js";

export class SharedUserService {
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
    // Get user info
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new PhotoBlogError("User not found", 404);
    }
    // Generate a temporary public key and private key
    const { tempPublicKey, tempPrivateKey } = this.generateTempKeys();
    // Create request body
    const requestBody: SharedUserInitRemoteRequestDTO = {
      requestFromUserInfo: {
        id: user.id,
        name: user.name,
        email: user.email,
        remoteAddress: user.address,
      },
      requestToUserInfo: {
        id: sharedUserInitRequest.requestToUserInfo.id,
      },
      tempPublicKey,
      timestamp: Date.now(),
      comment: sharedUserInitRequest.comment,
    };
    // Send the request to the remote user
    try {
      const response = await this.sharedUserConnector.sendRemoteSharingRequest(
        sharedUserInitRequest.requestToUserInfo.address,
        requestBody
      ) as SharedUserInitRespondDTO;
      // Check if the response is valid
      if (!response || !response.requestFromUserInfo || !response.requestToUserInfo) {
        throw new PhotoBlogError("Invalid response from remote user", 500);
      }
      // Generate a shared symmetric key using DHKE
      const sharedUserTempSymmetricKey = this.generateSharedSymmetricKey(
        tempPrivateKey,
        response.tempPublicKey
      );
      // Create a new shared user in the database
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
    // TODO: trigger user authentication
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
}