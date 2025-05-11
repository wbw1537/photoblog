import { SharedUser, User } from "@prisma/client";

import { PhotoBlogError } from "../errors/photoblog.error.js";
import { SessionRequestDTO, SessionResponseDTO, SharedUserContextRequestDTO, SharedUserExchangeKeyRequest, SharedUserExchangeKeyRespond, SharedUserInitRemoteRequestDTO, SharedUserInitRequestDTO, SharedUserValidateRequest } from "../models/shared-user.model.js";
import { PublicUserResponseDTO } from "../models/user.model.js";
import { API_URLS } from "../routes/api.constants.js"

export class SharedUserConnector {
  constructor() {}

  async getRemoteUsers(remoteAddress: string) {
    const remoteUsers = await fetch(`http://${remoteAddress}/api${API_URLS.USER.PUBLIC_USERS}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!remoteUsers.ok) {
      throw new PhotoBlogError(`Failed to fetch remote users: ${remoteUsers.statusText}`, 500);
    }
    const remoteUsersData = await remoteUsers.json() as PublicUserResponseDTO;
    return remoteUsersData;
  }

  async sendRemoteSharingRequest(remoteAddress: string, requestBody: SharedUserInitRemoteRequestDTO) {
    const response = await fetch(`${remoteAddress}/api${API_URLS.SHARED_USER.PUBLIC_INIT}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
      throw new PhotoBlogError(`Failed to send remote sharing request: ${response.statusText}`, 500);
    }
    const responseData = await response.json();
    return responseData;
  }

  async exchangeEncryptedPublicKey(remoteAddress: string, requestBody: SharedUserExchangeKeyRequest) {
    const response = await fetch(`${remoteAddress}/api${API_URLS.SHARED_USER.PUBLIC_EXCHANGE}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
      throw new PhotoBlogError(`Failed to exchange encrypted public key: ${response.statusText}`, 500);
    }
    const responseData = await response.json();
    if (!responseData || !responseData.encryptedPublicKey) {
      throw new PhotoBlogError("Invalid response from remote user", 500);
    }
    return responseData as SharedUserExchangeKeyRespond;
  }

  async validateRemotePublicKey(remoteAddress: string, requestBody: SharedUserValidateRequest) {
    const response = await fetch(`${remoteAddress}/api${API_URLS.SHARED_USER.PUBLIC_VALIDATE}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
      throw new PhotoBlogError(`Failed to validate remote public key: ${response.statusText}`, 500);
    } else {
      return true;
    }
  }

  async getSession(remoteAddress: string, requestBody: SessionRequestDTO) {
    const response = await fetch(`${remoteAddress}/api${API_URLS.SHARED_USER.PUBLIC_SESSION}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
      throw new PhotoBlogError(`Failed to get session: ${response.statusText}`, 500);
    }
    const responseData = await response.json();
    return responseData as SessionResponseDTO;
  }

  async requestSharedUser(remoteAddress: string, sharedUserContextRequest: SharedUserContextRequestDTO) {
    const response = await fetch(`${remoteAddress}/api/private/${sharedUserContextRequest.requestUrl}`, {
      method: sharedUserContextRequest.requestMethod,
      headers: sharedUserContextRequest.requestHeaders,
      body: JSON.stringify(sharedUserContextRequest.requestBody),
    });
    if (!response.ok) {
      throw new PhotoBlogError(`Failed to request shared user: ${response.statusText}`, 500);
    }
    const encryptedBase64 = await response.text();
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

  buildExchangeKeyRequestBody(user: User, sharedUser: SharedUser, encryptedUserPublicKey: string): SharedUserExchangeKeyRequest {
    return {
      requestToUserInfo: {
        id: user.id,
      },
      requestFromUserInfo: {
        id: sharedUser.id,
      },
      encryptedPublicKey: encryptedUserPublicKey,
      timestamp: Date.now(),
    };
  }

  buildValidateKeyRequestBody(user: User, sharedUser: SharedUser, signature: string): SharedUserValidateRequest {
    return {
      requestFromUserInfo: {
        id: sharedUser.id,
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