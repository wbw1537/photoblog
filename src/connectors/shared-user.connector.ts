import { SharedUser, User } from "@prisma/client";

import { PhotoBlogError } from "../errors/photoblog.error.js";
import { SessionRequestDTO, SessionResponseDTO, SharedUserContextRequestDTO, SharedUserExchangeKeyRequest, SharedUserExchangeKeyRespond, SharedUserInitRemoteRequestDTO, SharedUserInitRequestDTO, SharedUserValidateRequest } from "../models/shared-user.model.js";
import { PublicUserResponseDTO } from "../models/user.model.js";
import { API_URLS } from "../routes/api.constants.js"
import { Logger } from "log4js";

export class SharedUserConnector {
  constructor(
    private logger: Logger,
  ) {}

  async getRemoteUsers(remoteAddress: string) {
    const requestUrl = `http://${remoteAddress}/api${API_URLS.USER.PUBLIC_USERS}`;
    const remoteUsers = await fetch(requestUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!remoteUsers.ok) {
      this.logger.error(`Failed to fetch remote users: ${remoteUsers.statusText}, ${requestUrl}`);
      throw new PhotoBlogError(`Failed to fetch remote users: ${remoteUsers.statusText}`, 500);
    }
    const remoteUsersData = await remoteUsers.json() as PublicUserResponseDTO;
    return remoteUsersData;
  }

  async sendRemoteSharingRequest(remoteAddress: string, requestBody: SharedUserInitRemoteRequestDTO) {
    const requestUrl = `http://${remoteAddress}/api${API_URLS.SHARED_USER.PUBLIC_INIT}`;
    const response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
      this.logger.error(`Failed to send remote sharing request: ${response.statusText}, ${requestUrl}`);
      throw new PhotoBlogError(`Failed to send remote sharing request: ${response.statusText}`, 500);
    }
    const responseData = await response.json();
    return responseData;
  }

  async exchangeEncryptedPublicKey(remoteAddress: string, requestBody: SharedUserExchangeKeyRequest) {
    const requestUrl = `http://${remoteAddress}/api${API_URLS.SHARED_USER.PUBLIC_EXCHANGE}`;
    const response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
      this.logger.error(`Failed to exchange encrypted public key: ${response.statusText}, ${requestUrl}`);
      throw new PhotoBlogError(`Failed to exchange encrypted public key: ${response.statusText}`, 500);
    }
    const responseData = await response.json();
    if (!responseData || !responseData.encryptedPublicKey) {
      this.logger.error(`Invalid response from remote user: ${requestUrl}`);
      throw new PhotoBlogError("Invalid response from remote user", 500);
    }
    return responseData as SharedUserExchangeKeyRespond;
  }

  async validateRemotePublicKey(remoteAddress: string, requestBody: SharedUserValidateRequest) {
    const requestUrl = `http://${remoteAddress}/api${API_URLS.SHARED_USER.PUBLIC_VALIDATE}`;
    const response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
      this.logger.error(`Failed to validate remote public key: ${response.statusText}, ${requestUrl}`);
      throw new PhotoBlogError(`Failed to validate remote public key: ${response.statusText}`, 500);
    } else {
      return true;
    }
  }

  async getSession(remoteAddress: string, requestBody: SessionRequestDTO) {
    const requestUrl = `http://${remoteAddress}/api${API_URLS.SHARED_USER.PUBLIC_SESSION}`;
    const response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
      this.logger.error(`Failed to get session: ${response.statusText}, ${requestUrl}`);
      throw new PhotoBlogError(`Failed to get session: ${response.statusText}`, 500);
    }
    const responseData = await response.json();
    return responseData as SessionResponseDTO;
  }

  async requestSharedUser(remoteAddress: string, sharedUserContextRequest: SharedUserContextRequestDTO) {
    const requestUrl = `http://${remoteAddress}/api/private${sharedUserContextRequest.requestUrl}`;
    const response = await fetch(requestUrl, {
      method: sharedUserContextRequest.requestMethod,
      headers: sharedUserContextRequest.requestHeaders,
      body: JSON.stringify(sharedUserContextRequest.requestBody),
    });
    if (!response.ok) {
      this.logger.error(`Failed to request shared user: ${response.statusText}, ${requestUrl}`);
      throw new PhotoBlogError(`Failed to request shared user: ${response.statusText}`, 500);
    }
    if (requestUrl.includes("preview")) {
      return response;
    } 
    const encryptedBase64 = await response.json();
    return encryptedBase64;
  }

  buildInitRemoteRequestBody(user: User, sharedUserInitRequest: SharedUserInitRequestDTO, tempPublicKey: string): SharedUserInitRemoteRequestDTO {
    return {
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
  }

  // The Key Exchange Request always comes from the requestToUser
  buildExchangeKeyRequestBody(user: User, sharedUser: SharedUser, encryptedUserPublicKey: string): SharedUserExchangeKeyRequest {
    return {
      requestToUserInfo: {
        id: user.id,
      },
      requestFromUserInfo: {
        id: sharedUser.sharedUserId,
      },
      encryptedPublicKey: encryptedUserPublicKey,
      timestamp: Date.now(),
    };
  }

  buildValidateKeyRequestBody(user: User, sharedUser: SharedUser, signature: string): SharedUserValidateRequest {
    return {
      requestFromUserInfo: {
        id: sharedUser.sharedUserId,
      },
      requestToUserInfo: {
        id: user.id,
      },
      signature,
      timestamp: Date.now(),
    };
  }

  buildSessionRequestBody(user: User, sharedUserId: string, signature: string): SessionRequestDTO {
    return {
      requestFromUserInfo: {
        id: user.id,
      },
      requestToUserInfo: {
        id: sharedUserId,
      },
      signature,
      timestamp: Date.now(),
    };
  }
}