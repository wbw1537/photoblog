import { Request, Response } from "express";

import { ScanStatusService } from "../services/scan-status.service.js";

export class ScanStatusController {
  constructor(
    private scanStatusService: ScanStatusService
  ) {
  }

  async getStatus(req: Request, res: Response) {
    const userId = req.body.user.id;

    try {
      const status = this.scanStatusService.getScanStatus(userId);
      res.status(200).json(status);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ "message": error.message });
    }
  }
}