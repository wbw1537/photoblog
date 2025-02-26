import { User } from "@prisma/client";

import { PhotoBlogError } from "../errors/photoblog.error.js";
import { FileResolution } from "../models/photo-file.model.js";
import { PhotoFileRepository } from "../repositories/photo-file.repository.js";

export class PhotoFileService {
  constructor(
    private photoFileRepository: PhotoFileRepository,
  ) {}

  // To be implemented
  async getPhotoFileImageById(user: User, fileId: string, resolution: FileResolution) {
    const photoFile = await this.photoFileRepository.findById(fileId);
    if (!photoFile) {
      throw new PhotoBlogError("Photo file not found", 404);
    } else if (photoFile.photo.userId !== user.id) {
      throw new PhotoBlogError("Unauthorized", 401);
    }

    if (resolution === FileResolution.ORIGINAL) {
      const userBasePath = user.basePath;
      console.log(`${userBasePath}/${photoFile.filePath}`);
      return `${userBasePath}/${photoFile.filePath}`;
    } else {
      throw new PhotoBlogError("Resolution not supported", 400);
    }
  }
}
