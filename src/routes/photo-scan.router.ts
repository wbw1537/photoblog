import express, { NextFunction, Request, Response, RequestHandler } from 'express';
import { PhotoScanService } from "../services/photo-scan.service.js";

export function createPhotoScanRouter(
  photoScanService: PhotoScanService,
  authenticate: RequestHandler
) {
  const photoScanRouter = express.Router();

  photoScanRouter.post('/v1/scan', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.body.user;
      const jobId = await photoScanService.scan(user.id);
      res.status(202).json({ "jobId": jobId });
    } catch (error: unknown) {
      next(error);
    }
  });

  photoScanRouter.post('/v1/delta-scan', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.body.user;
      const jobId = await photoScanService.deltaScan(user.id);
      res.status(200).json({ "jobId": jobId });
    } catch (error: unknown) {
      next(error);
    }
  });

  return photoScanRouter;
}