import { NextFunction, Request, Response } from "express";

import { PhotoScanService } from "../services/photo-scan.service.js";

export class PhotoScanController {
  private photoScanService: PhotoScanService;

  constructor(photoScanService: PhotoScanService) {
    this.photoScanService = photoScanService;
  }

  async scan(req: Request, res: Response, next: NextFunction) {
    const userId = req.body.user.id;

    try {
      const jobId = await this.photoScanService.scan(userId);
      res.status(202).json({ "jobId": jobId });
    } catch (error: unknown) {
      next(error);
    }
  }

  async deltaScan(req: Request, res: Response, next: NextFunction) {
    const userId = req.body.user.id;

    try {
      const jobId = await this.photoScanService.deltaScan(userId);
      res.status(200).json({ "jobId": jobId });
    } catch (error: unknown) {
      next(error);
    }
  }
}