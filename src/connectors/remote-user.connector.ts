import { User } from "@prisma/client";

import { PhotoBlogError } from "../errors/photoblog.error.js";
import { SessionRequestDTO, SessionResponseDTO, SharedUserContextRequestDTO, SharedUserExchangeKeyRequest, SharedUserExchangeKeyRespond, SharedUserInitRemoteRequestDTO, SharedUserValidateRequest } from "../models/shared-user.model.js";
import { PublicUserResponseDTO } from "../models/user.model.js";
import { Logger } from "log4js";

export class RemoteUserConnector {
  constructor(
    private logger: Logger,
  ) {}

  async getRemoteUsers(remoteInstanceUrl: string): Promise<PublicUserResponseDTO> {
    const requestUrl = `http://${remoteInstanceUrl}/api/public/v1/users`;
    const response = await fetch(requestUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      this.logger.error(`Failed to fetch remote users: ${response.statusText}, ${requestUrl}`);
      throw new PhotoBlogError(`Failed to fetch remote users: ${response.statusText}`, 500);
    }
    return await response.json() as PublicUserResponseDTO;
  }

  async sendRemoteSharingRequest(remoteInstanceUrl: string, requestBody: SharedUserInitRemoteRequestDTO) {
    const requestUrl = `http://${remoteInstanceUrl}/api/public/v1/shared-user/init`;
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
    return await response.json();
  }

  async exchangeEncryptedPublicKey(remoteInstanceUrl: string, requestBody: SharedUserExchangeKeyRequest): Promise<SharedUserExchangeKeyRespond> {
    const requestUrl = `http://${remoteInstanceUrl}/api/public/v1/shared-user/exchange`;
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
    if (!responseData?.encryptedPublicKey) {
      this.logger.error(`Invalid response from remote user: ${requestUrl}`);
      throw new PhotoBlogError("Invalid response from remote user", 500);
    }
    return responseData as SharedUserExchangeKeyRespond;
  }

  async validateRemotePublicKey(remoteInstanceUrl: string, requestBody: SharedUserValidateRequest): Promise<boolean> {
    const requestUrl = `http://${remoteInstanceUrl}/api/public/v1/shared-user/validate`;
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
    }
    return true;
  }

  async getSession(remoteInstanceUrl: string, requestBody: SessionRequestDTO): Promise<SessionResponseDTO> {
    const requestUrl = `http://${remoteInstanceUrl}/api/public/v1/shared-user/session`;
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
    return await response.json() as SessionResponseDTO;
  }

  async proxyRequestToRemote(remoteInstanceUrl: string, contextRequest: SharedUserContextRequestDTO) {
    const requestUrl = `http://${remoteInstanceUrl}/api/private${contextRequest.requestUrl}`;
    const response = await fetch(requestUrl, {
      method: contextRequest.requestMethod,
      headers: contextRequest.requestHeaders,
      body: JSON.stringify(contextRequest.requestBody),
    });
    if (!response.ok) {
      this.logger.error(`Failed to proxy request to remote: ${response.statusText}, ${requestUrl}`);
      throw new PhotoBlogError(`Failed to proxy request to remote: ${response.statusText}`, 500);
    }
    // For file streaming (like images), return the raw response object
    if (requestUrl.includes("preview") || requestUrl.includes("view")) {
      return response;
    } 
    return await response.json();
  }

  buildInitRemoteRequestBody(localUser: User, remoteUserInfo: { id: string; address: string; }, tempPublicKey: string): SharedUserInitRemoteRequestDTO {
    return {
      requestFromUserInfo: {
        id: localUser.id,
        name: localUser.name,
        email: localUser.email,
        remoteAddress: localUser.instanceUrl,
      },
      requestToUserInfo: {
        id: remoteUserInfo.id,
      },
      tempPublicKey,
      timestamp: Date.now(),
      comment: "", // Comment is part of the top-level DTO, not built here
    };
  }

  buildExchangeKeyRequestBody(localUser: User, remoteUser: User, encryptedUserPublicKey: string): SharedUserExchangeKeyRequest {
    return {
      requestToUserInfo: {
        id: remoteUser.id, // The request is sent TO the remote user
      },
      requestFromUserInfo: {
        id: localUser.id,
      },
      encryptedPublicKey: encryptedUserPublicKey,
      timestamp: Date.now(),
    };
  }

  buildValidateKeyRequestBody(localUser: User, remoteUser: User, signature: string): SharedUserValidateRequest {
    return {
      requestFromUserInfo: {
        id: localUser.id,
      },
      requestToUserInfo: {
        id: remoteUser.id,
      },
      signature,
      timestamp: Date.now(),
    };
  }

  buildSessionRequestBody(localUser: User, remoteUserId: string, signature: string): SessionRequestDTO {
    return {
      requestFromUserInfo: {
        id: localUser.id,
      },
      requestToUserInfo: {
        id: remoteUserId,
      },
      signature,
      timestamp: Date.now(),
    };
  }
}
