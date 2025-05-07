import { PhotoBlogError } from "../errors/photoblog.error.js";
import { SharedUserInitRemoteRequestDTO } from "../models/shared-user.model.js";
import { PublicUsersResponseDTO } from "../models/user.model.js";
import { API_URLS } from "../routes/api.constants.js"

export class SharedUserConnector {
  constructor() {}

  async getRemoteUsers(remoteAddress: string) {
    const remoteUsers = await fetch(`${remoteAddress}/api/${API_URLS.USER.PUBLIC_USERS}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!remoteUsers.ok) {
      throw new PhotoBlogError(`Failed to fetch remote users: ${remoteUsers.statusText}`, 500);
    }
    const remoteUsersData = await remoteUsers.json() as PublicUsersResponseDTO;
    return remoteUsersData;
  }

  async sendRemoteSharingRequest(remoteAddress: string, requestBody: SharedUserInitRemoteRequestDTO) {
    const response = await fetch(`${remoteAddress}/api/${API_URLS.SHARED_USER.PUBLIC_INIT}`, {
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
}