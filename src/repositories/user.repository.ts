import { PrismaClient, User } from "@prisma/client";

import { CreateUserDTO } from "../models/user.model.js";

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
          where: { isDeleted: false },
          include: {
            files: {
              where: { isDeleted: false }
            }
          }
        }
      },
    });
  }

  async findByEmail(email: string) {
    return await this.prismaClient.user.findUnique({
      where: { email },
    });
  }

  async create(user: CreateUserDTO) {
    return await this.prismaClient.user.create({
      data: {
        name: user.name,
        password: user.password,
        email: user.email,
        basePath: user.basePath,
      },
    });
  }
}