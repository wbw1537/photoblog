import { LocalUser, PhotoFile, User } from "@prisma/client";
import path from "path";
import crypto from "crypto";

import { PhotoBlogError } from "../errors/photoblog.error.js";
import { FileResolution } from "../models/photo-file.model.js";
import { PhotoFileRepository } from "../repositories/photo-file.repository.js";

// Define a more specific type for a user with their local details included
type UserWithLocalDetails = User & { localUser: LocalUser | null };

export class PhotoFileService {
  constructor(
    private photoFileRepository: PhotoFileRepository,
  ) {}

  async getPhotoFileImageById(user: UserWithLocalDetails, fileId: string, resolution: FileResolution) {
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

  private getOriginalPhotoPath(user: UserWithLocalDetails, photoFile: PhotoFile) {
    if (!user.localUser?.basePath) {
      throw new PhotoBlogError('User base path is not configured.', 500);
    }
    return path.join(user.localUser.basePath, photoFile.filePath);
  }

  private getPreviewPhotoPath(user: UserWithLocalDetails, photoFile: PhotoFile) {
    if (!user.localUser?.cachePath) {
      throw new PhotoBlogError('User cache path is not configured.', 500);
    }
    // Create a hash from the filepath to match preview storage location
    const fileHash = crypto.createHash('md5').update(photoFile.filePath).digest('hex');
    const hashPrefix = fileHash.substring(0, 2);
    
    return path.join(user.localUser.cachePath, 'previews', hashPrefix, `${fileHash}.webp`);
  }
}
