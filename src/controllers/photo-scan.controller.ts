import { Request, Response } from "express";

import { PhotoScanService } from "../services/photo-scan.service.js";

export class PhotoScanController {
  private photoScanService: PhotoScanService;

  constructor(photoScanService: PhotoScanService) {
    this.photoScanService = photoScanService;
  }

  async scan(req: Request, res: Response) {
    res.status(200).send("Scan started");
    // Run the scan task in the background
    this.photoScanService.scan().catch(err => console.error(err));
  }
}