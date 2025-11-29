import { PhotoLocation, PrismaClient, Prisma } from "@prisma/client";

export class PhotoLocationRepository {
  constructor(
    private prismaClient: PrismaClient
  ) {}

  async findByPhotoId(photoId: string): Promise<PhotoLocation | null> {
    return await this.prismaClient.photoLocation.findUnique({
      where: {
        photoId,
      },
    });
  }

  async create(data: Prisma.PhotoLocationCreateInput): Promise<PhotoLocation> {
    return await this.prismaClient.photoLocation.create({
      data,
    });
  }

  async update(photoId: string, data: Prisma.PhotoLocationUpdateInput): Promise<PhotoLocation> {
    return await this.prismaClient.photoLocation.update({
      where: {
        photoId,
      },
      data,
    });
  }

  async upsert(
    photoId: string,
    create: Prisma.PhotoLocationCreateInput,
    update: Prisma.PhotoLocationUpdateInput
  ): Promise<PhotoLocation> {
    return await this.prismaClient.photoLocation.upsert({
      where: {
        photoId,
      },
      create,
      update,
    });
  }

  async delete(photoId: string): Promise<PhotoLocation> {
    return await this.prismaClient.photoLocation.delete({
      where: {
        photoId,
      },
    });
  }

  /**
   * Find photos within a bounding box (simple lat/lng range query)
   * For more advanced spatial queries, upgrade to PostGIS
   */
  async findInBoundingBox(
    minLat: number,
    maxLat: number,
    minLon: number,
    maxLon: number
  ): Promise<PhotoLocation[]> {
    return await this.prismaClient.photoLocation.findMany({
      where: {
        latitude: {
          gte: minLat,
          lte: maxLat,
        },
        longitude: {
          gte: minLon,
          lte: maxLon,
        },
      },
      include: {
        photo: true,
      },
    });
  }
}
