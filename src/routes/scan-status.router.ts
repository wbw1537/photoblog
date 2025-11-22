import express, { NextFunction, Request, Response, RequestHandler } from 'express';
import { ScanStatusService } from "../services/scan-status.service.js";

export function createScanStatusRouter(
  scanStatusService: ScanStatusService,
  authenticate: RequestHandler
) {
  const scanStatusRouter = express.Router();

  scanStatusRouter.get('/v1/scan-status', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.body.user;
      const status = scanStatusService.getScanStatus(user.id);
      res.status(200).json(status);
    } catch (error: unknown) {
      next(error);
    }
  });

  return scanStatusRouter;
}