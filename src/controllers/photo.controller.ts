import { NextFunction, Request, Response } from "express";

import { PhotosRequest } from "../models/photo.model.js";

import { PhotoService } from "../services/photo.service.js";

export class PhotoController {
  constructor(
    private photoService: PhotoService,
  ) { }

  async getPhotos(req: Request, res: Response, next: NextFunction) {
    try {
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

      const userId = req.body.user.id;
      const photos = await this.photoService.getPhotos(userId, photosRequest);
      res.status(200).json(photos);
    } catch (error) {
      next(error);
    }
  }

  async getPhotoById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      const userId = req.body.user.id;
      const photo = await this.photoService.getPhotoById(userId, id);
      res.status(200).json(photo);
    } catch (error) {
      next(error);
    }
  }

  async likePhoto(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.body.user.id;
      const photoId = req.params.id;
      const response = await this.photoService.likePhoto(userId, photoId);
      res.status(204).json(response);
    } catch (error) {
      next(error);
    }
  }

  async unlikePhoto(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.body.user.id;
      const photoId = req.params.id;
      await this.photoService.unlikePhoto(userId, photoId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}