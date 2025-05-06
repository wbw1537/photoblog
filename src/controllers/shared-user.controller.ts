import { NextFunction, Request, Response } from "express";

import { SharedUserInitRequestDTO } from "../models/shared-user.model.js";
import { SharedUserService } from "../services/shared-user.service.js";

export class SharedUserController {
  constructor(
    private sharedUserService: SharedUserService
  ) { }

  async fetchRemoteUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const remoteAddress = req.query.remoteAddress as string;
      if (!remoteAddress) {
        res.status(400).json({ error: "Missing remoteAddress query parameter" });
        return;
      }
      const remoteUsers = await this.sharedUserService.fetchRemoteUsers(remoteAddress);
      res.status(200).json(remoteUsers);
    } catch (error: unknown) {
      next(error);
    }
  }

  async initRemoteSharingRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const sharedUserRequest: SharedUserInitRequestDTO = req.body;
      if (!sharedUserRequest) {
        res.status(400).json({ error: "Missing request body" });
      }
      if (!sharedUserRequest.requestFromUserInfo) {
        res.status(400).json({ error: "Missing requestFromUserInfo" });
      }
      if (!sharedUserRequest.requestToUserInfo) {
        res.status(400).json({ error: "Missing requestToUserInfo" });
      }
      if (!sharedUserRequest.requestFromUserInfo.id) {
        res.status(400).json({ error: "Missing requestFromUserInfo.id" });
      }
      if (!sharedUserRequest.requestFromUserInfo.id ||
        !sharedUserRequest.requestFromUserInfo.name ||
        !sharedUserRequest.requestFromUserInfo.email ||
        !sharedUserRequest.requestFromUserInfo.remoteAddress ||
        !sharedUserRequest.requestToUserInfo.id ||
        !sharedUserRequest.tempPublicKey ||
        !sharedUserRequest.timestamp ||
        !sharedUserRequest.comment) {
        res.status(400).json(
          { error: "Missing required fields" });
      }
      if (sharedUserRequest.timestamp < Date.now() / 1000 - 60 * 5) {
        // Allow a 5 minute window for the timestamp to be valid
        res.status(400).json({ error: "Timestamp is too old" });
      }
      if (sharedUserRequest.timestamp > Date.now()) {
        res.status(400).json({ error: "Timestamp is in the future" });
      }

      const response = await this.sharedUserService.initRemoteSharingRequest(sharedUserRequest);
      res.status(201).json(response);
    } catch (error: unknown) {
      next(error);
    }
  }
}