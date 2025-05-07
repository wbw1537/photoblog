import { Prisma, PrismaClient, SharedUserDirection, SharedUserStatus } from "@prisma/client";

import { SharedUserInitRemoteRequestDTO, SharedUserInitRespondDTO } from "../models/shared-user.model.js";

export class SharedUserRepository {
  constructor(
    private prismaClient: PrismaClient
  ) { }

  async findAllByFilter(
    skip: number,
    take: number,
    filter: Prisma.SharedUserWhereInput
  ) {
    const [sharedUsers, total] = await this.prismaClient.$transaction([
      this.prismaClient.sharedUser.findMany({
        take,
        skip,
        where: {
          AND: [
            filter,
          ],
        },
        select: {
          id: true,
          userId: true,
          sharedUserId: true,
          sharedUserName: true,
          sharedUserEmail: true,
          sharedUserAddress: true,
          status: true,
          direction: true,
          comment: true,
        },
      }),
      this.prismaClient.sharedUser.count({
        where: {
          AND: [
            filter,
          ],
        },
      }),
    ]);

    return {
      data: sharedUsers,
      pagination: {
        skip,
        take,
        total
      }
    }
  }

  async createIncomingSharedUser(
    sharedUserRequest: SharedUserInitRemoteRequestDTO,
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
        status: SharedUserStatus.Pending,
        direction: SharedUserDirection.Incoming,

        sharedUserPublicKey: sharedUserRequest.tempPublicKey,
        sharedUserTempSymmetricKey: sharedUserTempSymmetricKey
      },
    });
  }

  async createOutgoingSharedUser(
    SharedUserInitRespond: SharedUserInitRespondDTO,
    sharedUserTempSymmetricKey: string
  ) {
    return await this.prismaClient.sharedUser.create({
      data: {
        userId: SharedUserInitRespond.requestFromUserInfo.id,
        comment: '', 
        sharedUserId: SharedUserInitRespond.requestToUserInfo.id,
        sharedUserName: SharedUserInitRespond.requestToUserInfo.name,
        sharedUserEmail: SharedUserInitRespond.requestToUserInfo.email,
        sharedUserAddress: SharedUserInitRespond.requestToUserInfo.remoteAddress,
        status: SharedUserStatus.Pending,
        direction: SharedUserDirection.Outgoing,

        sharedUserPublicKey: SharedUserInitRespond.tempPublicKey,
        sharedUserTempSymmetricKey: sharedUserTempSymmetricKey
      },
    });
  }
}