import { PrismaClient, UserType } from "@prisma/client";

import { CreateUserDTO, ModifyUserInfoRequestDTO } from "../models/user.model.js";

export class UserRepository {
  constructor(
    private prismaClient: PrismaClient
  ) {
  }

  async findById(id: string) {
    return await this.prismaClient.user.findUnique({
      where: { id },
    });
  }

  async findAllById(id: string) {
    return await this.prismaClient.user.findUnique({
      where: { id },
      include: {
        photos: {
          include: {
            files: true,
          }
        }
      },
    });
  }

  async findAll(skip: number, take: number) {
    return await this.prismaClient.user.findMany({
      skip,
      take,
      select : {
        id: true,
        name: true,
        email: true,
        address: true,
      }
    });
  }

  async findByEmail(email: string) {
    return await this.prismaClient.user.findUnique({
      where: { email },
    });
  }

  async getBasePathById(id: string) {
    return await this.prismaClient.user.findUnique({
      where: { id },
      select: { basePath: true },
    });
  }

  async create(user: CreateUserDTO, publicKey: string, privateKey: string) {
    // The first user is the admin
    const isFirstUser = await this.prismaClient.user.count() === 0;
    const userType = isFirstUser ? UserType.Admin : UserType.Pending;
    return await this.prismaClient.user.create({
      data: {
        name: user.name,
        password: user.password,
        email: user.email,
        type: userType,
        publicKey,
        privateKey,
      },
    });
  }

  async update(id: string, user: Partial<ModifyUserInfoRequestDTO>) {
    return await this.prismaClient.user.update({
      where: { id },
      data: {
        name: user.name,
        email: user.email,
        password: user.password,
        address: user.address,
        basePath: user.basePath,
        cachePath: user.cachePath,
      }
    });
  }
}