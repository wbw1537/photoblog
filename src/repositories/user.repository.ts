import { PrismaClient, UserType } from "@prisma/client";

import { CreateUserDTO, ModifyUserInfoRequestDTO } from "../models/user.model.js";

export class UserRepository {
  constructor(
    private prismaClient: PrismaClient
  ) {
  }

  async findLocalUserById(id: string) {
    return await this.prismaClient.user.findUnique({
      where: { id, type: UserType.Normal },
      include: {
        localUser: true
      }
    });
  }

  async findLocalUserPhotosForScan(userId: string) {
    return this.prismaClient.user.findUnique({
      where: { id: userId, type: UserType.Normal },
      select: {
        id: true,
        localUser: {
          select: {
            basePath: true,
            cachePath: true,
          }
        },
        photos: {
          select: {
            id: true,
            files: {
              select: {
                id: true,
                filePath: true,
                fileHash: true,
                photoId: true,
                status: true
              }
            }
          }
        }
      }
    });
  }

  async findAll() {
    return await this.prismaClient.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        instanceUrl: true,
      }
    });
  }

  async findById(id: string) {
    return await this.prismaClient.user.findUnique({
      where: { id },
      include: {
        localUser: true,
        remoteUser: true,
      }
    });
  }

  async findLocalUserByEmail(email: string) {
    return await this.prismaClient.user.findUnique({
      where: { email, type: UserType.Normal },
      include: {
        localUser: true
      }
    });
  }

  async getBasePathById(id: string) {
    return await this.prismaClient.user.findUnique({
      where: { id },
      select: { 
        localUser: {
          select: {
            basePath: true
          }
        },
      }
    });
  }

  async createLocalUser(user: CreateUserDTO, publicKey: string, privateKey: string) {
    // The first user is the admin
    const isFirstUser = await this.prismaClient.user.count() === 0;
    const userType = isFirstUser ? UserType.Admin : UserType.Pending;

    return await this.prismaClient.user.create({
      data: {
        name: user.name,
        email: user.email,
        type: userType,
        localUser: {
          create: {
            password: user.password,
            publicKey: publicKey,
            privateKey: privateKey,
          }
        }
      },
      include: {
        localUser: true
      }
    });
  }

  async update(id: string, user: Partial<ModifyUserInfoRequestDTO>) {
    return await this.prismaClient.user.update({
      where: { id },
      data: {
        name: user.name,
        email: user.email,
        instanceUrl: user.instanceUrl,
        localUser: {
          update: {
            password: user.password,
            basePath: user.basePath,
            cachePath: user.cachePath,
          }
        }
      },
      include: {
        localUser: true
      }
    });
  }

  async upsertRemoteUser(email: string, name: string, instanceUrl: string, remoteUserData: { [key: string]: any }) {
    return await this.prismaClient.user.upsert({
      where: { email },
      update: {
        name,
        instanceUrl,
        remoteUser: {
          update: {
            ...remoteUserData
          }
        }
      },
      create: {
        email,
        name,
        instanceUrl,
        type: UserType.Remote,
        remoteUser: {
          create: {
            instanceUrl,
            ...remoteUserData
          }
        }
      },
      include: {
        remoteUser: true
      }
    });
  }

  async updateRemoteUser(userId: string, remoteUserData: { [key: string]: any }) {
    return await this.prismaClient.user.update({
      where: { id: userId },
      data: {
        remoteUser: {
          update: {
            ...remoteUserData,
          },
        },
      },
      include: {
        remoteUser: true,
      },
    });
  }
}