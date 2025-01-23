import { Request, Response } from "express";

import { PhotoScanService } from "../services/photo-scan.service.js";

export class PhotoScanController {
  private photoScanService: PhotoScanService;

  constructor(photoScanService: PhotoScanService) {
    this.photoScanService = photoScanService;
  }

  async scan(req: Request, res: Response) {
    const userId = req.body.user.id;

    try {
      const jobId = await this.photoScanService.scan(userId);
      res.status(202).json({ "jobId": jobId });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ "message": error.message });
    }
  }

  async deltaScan(req: Request, res: Response) {
    const userId = req.body.user.id;

    try {
      const jobId = await this.photoScanService.deltaScan(userId);
      res.status(200).json({ "jobId": jobId });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ "message": error.message });
    }
  }
}