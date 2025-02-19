import { NextFunction, Request, Response } from "express";

import { ScanStatusService } from "../services/scan-status.service.js";

export class ScanStatusController {
  constructor(
    private scanStatusService: ScanStatusService
  ) {
  }

  async getStatus(req: Request, res: Response, next: NextFunction) {
    const userId = req.body.user.id;

    try {
      const status = this.scanStatusService.getScanStatus(userId);
      res.status(200).json(status);
    } catch (error: unknown) {
      next(error);
    }
  }
}