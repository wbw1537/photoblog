import { PrismaClient } from "@prisma/client";

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
          include: {
            files: true,
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

  async getBasePathById(id: string) {
    return await this.prismaClient.user.findUnique({
      where: { id },
      select: { basePath: true },
    });
  }

  async create(user: CreateUserDTO) {
    return await this.prismaClient.user.create({
      data: {
        name: user.name,
        password: user.password,
        email: user.email
      },
    });
  }
}