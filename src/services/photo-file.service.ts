import { PhotoFile, User } from "@prisma/client";
import path from "path";
import crypto from "crypto";

import { PhotoBlogError } from "../errors/photoblog.error.js";
import { FileResolution } from "../models/photo-file.model.js";
import { PhotoFileRepository } from "../repositories/photo-file.repository.js";

export class PhotoFileService {
  constructor(
    private photoFileRepository: PhotoFileRepository,
  ) {}

  async getPhotoFileImageById(user: User, fileId: string, resolution: FileResolution) {
    const photoFile = await this.photoFileRepository.findById(fileId);
    if (!photoFile) {
      throw new PhotoBlogError("Photo file not found", 404);
    } else if (photoFile.photo.userId !== user.id) {
      throw new PhotoBlogError("Unauthorized", 401);
    }

    switch (resolution) {
      case FileResolution.ORIGINAL:
        return this.getOriginalPhotoPath(user, photoFile);
      case FileResolution.PREVIEW:
        return this.getPreviewPhotoPath(user, photoFile);
      default:
        throw new PhotoBlogError("Resolution not supported", 400);
    }
  }

  private getOriginalPhotoPath(user: User, photoFile: PhotoFile) {
    return path.join(user.basePath, photoFile.filePath);
  }

  private getPreviewPhotoPath(user: User, photoFile: PhotoFile) {
    // Create a hash from the filepath to match how it's stored in ConvertPhotoJob
    const fileHash = crypto.createHash('md5').update(photoFile.filePath).digest('hex');
    const hashPrefix = fileHash.substring(0, 2);
    
    return path.join(user.cachePath, 'previews', hashPrefix, `${fileHash}.webp`);
  }
}
