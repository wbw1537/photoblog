import { PrismaClient, SharedUserStatus } from "@prisma/client";

import { SharedUserInitRequestDTO } from "../models/shared-user.model.js";

export class SharedUserRepository {
  constructor(
    private prismaClient: PrismaClient
  ) { }

  async createIncomingSharedUser(
    sharedUserRequest: SharedUserInitRequestDTO,
    sharedUserTempSymmetricKey: string
  ) {
    return await this.prismaClient.sharedUser.create({
      data: {
        userId: sharedUserRequest.requestToUserInfo.id,
        comment: sharedUserRequest.comment,
        sharedUserId: sharedUserRequest.requestFromUserInfo.id,
        sharedUserName: sharedUserRequest.requestFromUserInfo.name,
        sharedUserEmail: sharedUserRequest.requestFromUserInfo.email,
        sharedUserAddress: sharedUserRequest.requestFromUserInfo.remoteAddress,
        status: SharedUserStatus.Incoming,

        sharedUserPublicKey: sharedUserRequest.tempPublicKey,
        sharedUserTempSymmetricKey: sharedUserTempSymmetricKey
      },
    });
  }
}