import express, { NextFunction, Request, Response, RequestHandler } from 'express';
import { PhotosRequest } from '../models/photo.model.js';
import { PhotoService } from '../services/photo.service.js';

export function createPhotoRouter(
  photoService: PhotoService,
  authenticate: RequestHandler
) {
  const photoRouter = express.Router();

// Public routes
photoRouter.get('/v1/photos', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.body.user;
    const photosRequest: PhotosRequest = {
      title: req.query.title as string,
      liked: req.query.liked ? req.query.liked === 'true' : undefined,
      cameraMake: req.query.cameraMake as string,
      cameraModel: req.query.cameraModel as string,
      lensMake: req.query.lensMake as string,
      lensModel: req.query.lensModel as string,
      minFocalLength: parseFloat(req.query.minFocalLength as string) || undefined,
      maxFocalLength: parseFloat(req.query.maxFocalLength as string) || undefined,
      minFNumber: parseFloat(req.query.minFNumber as string) || undefined,
      maxFNumber: parseFloat(req.query.maxFNumber as string) || undefined,
      minIso: parseInt(req.query.minIso as string, 10) || undefined,
      maxIso: parseInt(req.query.maxIso as string, 10) || undefined,
      minExposureTime: parseFloat(req.query.minExposureTime as string) || undefined,
      maxExposureTime: parseFloat(req.query.maxExposureTime as string) || undefined,
      dateTakenStart: req.query.dateTakenStart ? new Date(req.query.dateTakenStart as string) : undefined,
      dateTakenEnd: req.query.dateTakenEnd ? new Date(req.query.dateTakenEnd as string) : undefined,
      tags: req.query.tags ? (req.query.tags as string).split(',') : [],
      latitude: parseFloat(req.query.latitude as string) || undefined,
      longitude: parseFloat(req.query.longitude as string) || undefined,
      radius: parseFloat(req.query.radius as string) || undefined,
      skip: parseInt(req.query.skip as string, 10) || 0,
      take: parseInt(req.query.take as string, 10) || 10,
    };

    const photos = await photoService.getPhotos(user.id, photosRequest);
    res.status(200).json(photos);
  } catch (error) {
    next(error);
  }
});

photoRouter.get('/v1/photos/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.body.user;
    const id = req.params.id;
    const photo = await photoService.getPhotoById(user.id, id);
    res.status(200).json(photo);
  } catch (error) {
    next(error);
  }
});

photoRouter.post('/v1/photos/:id/like', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.body.user;
    const photoId = req.params.id;
    const response = await photoService.likePhoto(user.id, photoId);
    res.status(204).json(response);
  } catch (error) {
    next(error);
  }
});

photoRouter.delete('/v1/photos/:id/like', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.body.user;
    const photoId = req.params.id;
    await photoService.unlikePhoto(user.id, photoId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Private routes
photoRouter.get('/private/v1/photos', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.body.user;
    const photosRequest: PhotosRequest = {
      title: req.query.title as string,
      liked: req.query.liked ? req.query.liked === 'true' : undefined,
      cameraMake: req.query.cameraMake as string,
      cameraModel: req.query.cameraModel as string,
      lensMake: req.query.lensMake as string,
      lensModel: req.query.lensModel as string,
      minFocalLength: parseFloat(req.query.minFocalLength as string) || undefined,
      maxFocalLength: parseFloat(req.query.maxFocalLength as string) || undefined,
      minFNumber: parseFloat(req.query.minFNumber as string) || undefined,
      maxFNumber: parseFloat(req.query.maxFNumber as string) || undefined,
      minIso: parseInt(req.query.minIso as string, 10) || undefined,
      maxIso: parseInt(req.query.maxIso as string, 10) || undefined,
      minExposureTime: parseFloat(req.query.minExposureTime as string) || undefined,
      maxExposureTime: parseFloat(req.query.maxExposureTime as string) || undefined,
      dateTakenStart: req.query.dateTakenStart ? new Date(req.query.dateTakenStart as string) : undefined,
      dateTakenEnd: req.query.dateTakenEnd ? new Date(req.query.dateTakenEnd as string) : undefined,
      tags: req.query.tags ? (req.query.tags as string).split(',') : [],
      latitude: parseFloat(req.query.latitude as string) || undefined,
      longitude: parseFloat(req.query.longitude as string) || undefined,
      radius: parseFloat(req.query.radius as string) || undefined,
      skip: parseInt(req.query.skip as string, 10) || 0,
      take: parseInt(req.query.take as string, 10) || 10,
    };

    const photos = await photoService.getPhotos(user.id, photosRequest);
    res.status(200).json(photos);
  } catch (error) {
    next(error);
  }
});

photoRouter.get('/private/v1/photos/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.body.user;
    const id = req.params.id;
    const photo = await photoService.getPhotoById(user.id, id);
    res.status(200).json(photo);
  } catch (error) {
    next(error);
  }
});

  return photoRouter;
}