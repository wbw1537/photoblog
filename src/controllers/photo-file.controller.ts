import { NextFunction, Request, Response } from "express";

import { PhotoFileService } from "../services/photo-file.service.js";
import { FileResolution } from "../models/photo-file.model.js";
import { PhotoBlogError } from "../errors/photoblog.error.js";

export class PhotoFileController {
  constructor(
    private photoFileService: PhotoFileService
  ) {}

  async getPhotoFileImageById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.body.user;
      const fileId = req.params.fileId;
      const resolution = req.query.resolution as FileResolution;
      if (!resolution) {
        throw new PhotoBlogError('Resolution is required', 400);
      }
      const photoPath = await this.photoFileService.getPhotoFileImageById(user, fileId as string, resolution);
      res.sendFile(photoPath);
    } catch (error) {
      next(error);
    }
  }
}