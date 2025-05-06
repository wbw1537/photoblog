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
      throw new Error(`Failed to fetch remote users: ${remoteUsers.statusText}`);
    }
    const remoteUsersData = await remoteUsers.json() as PublicUsersResponseDTO;
    return remoteUsersData;
  }
}