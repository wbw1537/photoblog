import express, { NextFunction, Request, Response, RequestHandler } from 'express';
import { ScanStatusService } from "../services/scan-status.service.js";

export function createScanStatusRouter(
  scanStatusService: ScanStatusService,
  authenticate: RequestHandler
) {
  const scanStatusRouter = express.Router();

  scanStatusRouter.get('/v1/scan-status', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.body.user.id;

    try {
      const status = scanStatusService.getScanStatus(userId);
      res.status(200).json(status);
    } catch (error: unknown) {
      next(error);
    }
  });

  return scanStatusRouter;
}