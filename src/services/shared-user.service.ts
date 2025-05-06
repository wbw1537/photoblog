import crypto from "crypto";

import { SharedUserInitRequestDTO , SharedUserInitRespondDTO} from "../models/shared-user.model.js";
import { SharedUserRepository } from "../repositories/shared-user.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { SharedUserConnector } from "../connectors/shared-user.connector.js";
import { PublicUsersResponseDTO } from "../models/user.model.js";

export class SharedUserService {
  constructor(
    private sharedUserRepository: SharedUserRepository,
    private userRepository: UserRepository,
    private sharedUserConnector: SharedUserConnector
  ) {}

  async fetchRemoteUsers(remoteAddress: string): Promise<PublicUsersResponseDTO> {
    // Fetch all remote users from the database
    const remoteUsers = await this.sharedUserConnector.getRemoteUsers(remoteAddress);
    return remoteUsers;
  }

  async initRemoteSharingRequest(sharedUserRequest: SharedUserInitRequestDTO): Promise<SharedUserInitRespondDTO> {
    // check if the user exists
    const user = await this.userRepository.findById(sharedUserRequest.requestFromUserInfo.id);
    if (!user) {
      throw new Error("User not found");
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

  private generateSharedSymmetricKey(tempPrivateKey: string, requestFromPublicKey: string): string {
    // Convert keys from PEM format to buffers
    const privateKey = crypto.createPrivateKey({ key: tempPrivateKey, format: "pem" });
    const publicKey = crypto.createPublicKey({ key: requestFromPublicKey, format: "pem" });

    // Derive a shared secret using ECDH (Elliptic Curve Diffie-Hellman)
    const sharedSecret = crypto.diffieHellman({
      privateKey,
      publicKey,
    });

    // Hash the shared secret to generate a symmetric key
    const symmetricKey = crypto.createHash("sha256").update(sharedSecret).digest("hex");

    return symmetricKey;
  }
}