import { PrismaClient, Prisma } from "@prisma/client";

import { Photo } from "@prisma/client";

export class PhotoRepository {
  private prismaClient: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prismaClient = prismaClient;
  }

  async findById(id: string) {
    return await this.prismaClient.photo.findUnique({
      where: { 
        id,
      },
    });
  }

  async findAllByUserId(userId: string) {
    return await this.prismaClient.photo.findMany({
      where: { userId },
      include: { files: true },
    });
  }

  async create(photo: Prisma.PhotoCreateInput) {
    return await this.prismaClient.photo.create({
      data: photo
    });
  }

  async update(photo: Photo) {
    return await this.prismaClient.photo.update({
      where: { id: photo.id },
      data: photo,
    });
  }

  async deletePhotoAndFiles(photoId: string) {
    return await this.prismaClient.$transaction(async (prisma) => {
      await prisma.photoFile.deleteMany({
        where: {
          photoId,
        },
      });
      await prisma.photo.delete({
        where: {
          id: photoId,
        },
      });
    });
  }
}