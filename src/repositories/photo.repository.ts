import { PrismaClient, Prisma, Photo } from "@prisma/client";

export class PhotoRepository {
  constructor(
    private prismaClient: PrismaClient
  ) { }

  async findById(id: string) {
    return await this.prismaClient.photo.findUnique({
      where: { 
        id,
      },
    });
  }
  
  async findByIdAndUserId(id: string, userId: string) {
    const query = await this.prismaClient.photo.findUnique({
      where: {
        userId,
        id,
      },
    });
    return {
      data: query,
    }
  }

  async findAllByFilter(skip: number, take: number, filter: Prisma.PhotoWhereInput) {
    const [photos, total] = await this.prismaClient.$transaction([
      this.prismaClient.photo.findMany({
        take,
        skip,
        where: {
          AND: [
            filter,
          ],
        },
        include: {
          files: true,
          tags: {
            include: { tag: true },
          }
        },
      }),
      this.prismaClient.photo.count({
        where: {
          AND: [
            filter,
          ],
        },
      }),
    ]);
  
    return {
      data: photos,
      pagination: {
        skip,
        take,
        total
      }
    }
  }

  async likePhoto(userId: string, id: string) {
    return await this.prismaClient.photo.update({
      where: { id, userId },
      data: {
        liked: true
      },
    });
  }

  async unlikePhoto(userId: string, id: string) {
    return await this.prismaClient.photo.update({
      where: { id, userId },
      data: {
        liked: false
      },
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