import express, { NextFunction, Request, Response, RequestHandler } from 'express';
import { PhotoFileService } from "../services/photo-file.service.js";
import { FileResolution } from "../models/photo-file.model.js";
import { PhotoBlogError } from "../errors/photoblog.error.js";

export function createPhotoFileRouter(
  photoFileService: PhotoFileService,
  authenticate: RequestHandler
) {
  const photoFileRouter = express.Router();

  photoFileRouter.get('/v1/photos/view/:fileId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.body.user;
      const fileId = req.params.fileId;
      const resolution = req.query.resolution as FileResolution;
      if (!resolution) {
        throw new PhotoBlogError('Resolution is required', 400);
      }
      const photoPath = await photoFileService.getPhotoFileImageById(user, fileId as string, resolution);
      res.sendFile(photoPath);
    } catch (error) {
      next(error);
    }
  });

  photoFileRouter.get('/v1/photos/preview/:fileId', authenticate, (req: Request, res: Response, next: NextFunction) => {
    const user = req.body.user;
    const fileId = req.params.fileId;
    const resolution = FileResolution.PREVIEW;

    photoFileService.getPhotoFileImageById(user, fileId as string, resolution)
      .then(photoPath => res.sendFile(photoPath))
      .catch(error => next(error));
  });

  // Private routes
  photoFileRouter.get('/private/v1/photos/view/:fileId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.body.user;
      const fileId = req.params.fileId;
      const resolution = req.query.resolution as FileResolution;
      if (!resolution) {
        throw new PhotoBlogError('Resolution is required', 400);
      }
      const photoPath = await photoFileService.getPhotoFileImageById(user, fileId as string, resolution);
      res.sendFile(photoPath);
    } catch (error) {
      next(error);
    }
  });

  photoFileRouter.get('/private/v1/photos/preview/:fileId', authenticate, (req: Request, res: Response, next: NextFunction) => {
    const user = req.body.user;
    const fileId = req.params.fileId;
    const resolution = FileResolution.PREVIEW;

    photoFileService.getPhotoFileImageById(user, fileId as string, resolution)
      .then(photoPath => res.sendFile(photoPath))
      .catch(error => next(error));
  });

  return photoFileRouter;
}
