import { Prisma } from "@prisma/client";

import { PhotosRequest } from "../models/photo.model.js";

import { PhotoRepository } from "../repositories/photo.repository.js";
import { TagRepository } from "../repositories/tag.repository.js";

import { PhotoBlogError } from "../errors/photoblog.error.js";

export class PhotoService {
  constructor(
    private photoRepository: PhotoRepository,
    private tagRepository: TagRepository,
  ) { }

  async getPhotos(userId: string, photosRequest: PhotosRequest) {
    const tagIds = photosRequest.tags ? await this.tagRepository.findTagIds(photosRequest.tags) : [];
    const whereInput = this.buildWhereInput(userId, tagIds, photosRequest);
    return await this.photoRepository.findAllByFilter(photosRequest.skip, photosRequest.take, whereInput);
  }

  async getPhotoById(userId: string, id: string) {
    const photo = await this.photoRepository.findById(id);
    if (!photo) {
      throw new PhotoBlogError("Photo not found", 404);
    } else if (photo.userId !== userId) {
      throw new PhotoBlogError("Unauthorized", 403);
    }
    return { data: photo };
  }

  async likePhoto(userId: string, photoId: string) {
    try {
      return await this.photoRepository.likePhoto(userId, photoId);
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new PhotoBlogError("Photo not found", 404);
      }
      throw error;
    }
  }

  async unlikePhoto(userId: string, photoId: string) {
    try {
      return await this.photoRepository.unlikePhoto(userId, photoId);
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new PhotoBlogError("Photo not found", 404);
      }
      throw error;
    }
  }

  private buildWhereInput(userId: string, tagIds: string[], photosRequest: PhotosRequest) {
    const {
      title,
      liked,
      cameraMake,
      cameraModel,
      lensMake,
      lensModel,
      minFocalLength,
      maxFocalLength,
      minFNumber,
      maxFNumber,
      minIso,
      maxIso,
      minExposureTime,
      maxExposureTime,
      dateTakenStart,
      dateTakenEnd,
      latitude,
      longitude,
      radius,
    } = photosRequest;

    const buildRange = (min?: number, max?: number) => min !== undefined || max !== undefined ? { gte: min, lte: max } : undefined;
    const buildDateRange = (start?: Date, end?: Date) => start !== undefined || end !== undefined ? { gte: start, lte: end } : undefined;
    
    const whereInput: Prisma.PhotoWhereInput = {
      userId,
      title: title ? { contains: title } : undefined,
      liked,
      cameraMake: cameraMake ? { equals: cameraMake } : undefined,
      cameraModel: cameraModel ? { equals: cameraModel } : undefined,
      lensMake: lensMake ? { equals: lensMake } : undefined,
      lensModel: lensModel ? { equals: lensModel } : undefined,
      focalLength: buildRange(minFocalLength, maxFocalLength),
      fNumber: buildRange(minFNumber, maxFNumber),
      iso: buildRange(minIso, maxIso),
      exposureTime: buildRange(minExposureTime, maxExposureTime),
      dateTaken: buildDateRange(dateTakenStart, dateTakenEnd),
      gpsLatitude: latitude !== undefined && longitude !== undefined && radius !== undefined
        ? buildRange(latitude - radius, latitude + radius)
        : undefined,
      gpsLongitude: latitude !== undefined && longitude !== undefined && radius !== undefined
        ? buildRange(longitude - radius, longitude + radius)
        : undefined,
      tags: tagIds.length > 0 ? { some: { tagId: { in: tagIds } } } : undefined,
    };
    // Remove any undefined properties in whereInput to avoid issues with Prisma queries
    Object.keys(whereInput).forEach(
      (key) => (whereInput as never)[key] === undefined && delete (whereInput as never)[key]
    );
    return whereInput;
  }
}