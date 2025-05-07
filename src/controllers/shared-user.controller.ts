import { NextFunction, Request, Response } from "express";

import { SharedUserInitRemoteRequestDTO, SharedUserInitRequestDTO, SharedUserRequest } from "../models/shared-user.model.js";
import { SharedUserService } from "../services/shared-user.service.js";
import { SharedUserDirection, SharedUserStatus } from "@prisma/client";

export class SharedUserController {
  constructor(
    private sharedUserService: SharedUserService
  ) { }

  async getSharedUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.body.user.id;
      const sharedUserRequest: SharedUserRequest = {
        name: req.query.name as string,
        email: req.query.email as string,
        remoteAddress: req.query.remoteAddress as string,
        status: req.query.status as SharedUserStatus,
        direction: req.query.direction as SharedUserDirection,

        skip: parseInt(req.query.skip as string) || 0,
        take: parseInt(req.query.take as string) || 10,
      }
      const sharedUsers = await this.sharedUserService.getSharedUsers(userId, sharedUserRequest);
      res.status(200).json(sharedUsers);
    } catch (error: unknown) {
      next(error);
    }
  }

  async fetchRemoteUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const remoteAddress = req.query.remoteAddress as string;
      if (!remoteAddress) {
        res.status(400).json({ error: "Missing remoteAddress query" });
        return;
      }
      const remoteUsers = await this.sharedUserService.fetchRemoteUsers(remoteAddress);
      res.status(200).json(remoteUsers);
    } catch (error: unknown) {
      next(error);
    }
  }

  async initSharingRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.body.user.id;
      const sharedUserInitRequest: SharedUserInitRequestDTO = req.body;
      await this.sharedUserService.initSharingRequest(userId, sharedUserInitRequest);
      res.status(201);
    } catch (error: unknown) {
      next(error);
    }
  }

  async initRemoteSharingRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const sharedUserRequest: SharedUserInitRemoteRequestDTO = req.body;
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