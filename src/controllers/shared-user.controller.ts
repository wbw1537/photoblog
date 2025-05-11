import { SharedUserDirection, SharedUserStatus } from "@prisma/client";
import { NextFunction, Request, Response } from "express";

import { SharedUserContextRequestDTO, SharedUserExchangeKeyRequest, SharedUserInitRemoteRequestDTO, SharedUserInitRequestDTO, SharedUserRequest, SharedUserValidateRequest } from "../models/shared-user.model.js";
import { SharedUserService } from "../services/shared-user.service.js";
import { PhotoBlogError } from "../errors/photoblog.error.js";
import { SessionRequestDTO } from "../models/shared-user.model.js";

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
      const response = await this.sharedUserService.initSharingRequest(userId, sharedUserInitRequest);
      res.status(201).json(response);
    } catch (error: unknown) {
      next(error);
    }
  }

  async initRemoteSharingRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const sharedUserRequest: SharedUserInitRemoteRequestDTO = req.body;
      if (!sharedUserRequest) {
        res.status(400).json({ error: "Missing request body" });
        return;
      }
      if (!sharedUserRequest.requestFromUserInfo) {
        res.status(400).json({ error: "Missing requestFromUserInfo" });
        return;
      }
      if (!sharedUserRequest.requestToUserInfo) {
        res.status(400).json({ error: "Missing requestToUserInfo" });
        return;
      }
      if (!sharedUserRequest.requestFromUserInfo.id) {
        res.status(400).json({ error: "Missing requestFromUserInfo.id" });
        return;
      }
      if (!sharedUserRequest.requestFromUserInfo.name ||
          !sharedUserRequest.requestFromUserInfo.email ||
          !sharedUserRequest.requestFromUserInfo.remoteAddress ||
          !sharedUserRequest.requestToUserInfo.id ||
          !sharedUserRequest.tempPublicKey ||
          !sharedUserRequest.timestamp ||
          !sharedUserRequest.comment) {
        res.status(400).json({ error: "Missing required fields" });
        return;
      }
      this.validateTimestamp(sharedUserRequest.timestamp);
      const response = await this.sharedUserService.initRemoteSharingRequest(sharedUserRequest);
      res.status(201).json(response);
    } catch (error: unknown) {
      next(error);
    }
  }

  async setSharedUserActive(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.body.user.id;
      const sharedUserId = req.params.sharedUserId;
      await this.sharedUserService.setSharedUserActive(userId, sharedUserId);
      res.status(200).json({ message: "Shared user set to active" });
    } catch (error: unknown) {
      next(error);
    }
  }

  async exchangeRemotePublicKey(req: Request, res: Response, next: NextFunction) {
    try {
      const sharedUserExchangeKeyRequest: SharedUserExchangeKeyRequest = req.body;
      if (!sharedUserExchangeKeyRequest) {
        res.status(400).json({ error: "Missing request body" });
        return;
      }
      if (!sharedUserExchangeKeyRequest.requestFromUserInfo) {
        res.status(400).json({ error: "Missing requestFromUserInfo" });
        return;
      }
      if (!sharedUserExchangeKeyRequest.requestToUserInfo) {
        res.status(400).json({ error: "Missing requestToUserInfo" });
        return;
      }
      if (!sharedUserExchangeKeyRequest.requestFromUserInfo.id) {
        res.status(400).json({ error: "Missing requestFromUserInfo.id" });
        return;
      }
      if (!sharedUserExchangeKeyRequest.requestToUserInfo.id) {
        res.status(400).json({ error: "Missing requestToUserInfo.id" });
        return;
      }
      if (!sharedUserExchangeKeyRequest.encryptedPublicKey) {
        res.status(400).json({ error: "Missing encryptedPublicKey" });
        return;
      }
      if (!sharedUserExchangeKeyRequest.timestamp) {
        res.status(400).json({ error: "Missing timestamp" });
        return;
      }
      this.validateTimestamp(sharedUserExchangeKeyRequest.timestamp);
      const response = await this.sharedUserService.exchangeRemotePublicKey(sharedUserExchangeKeyRequest);
      res.status(200).json(response);
    } catch (error: unknown) {
      next(error);
    }
  }

  async validateRemotePublicKey(req: Request, res: Response, next: NextFunction) {
    try {
      const sharedUserExchangeKeyRequest: SharedUserValidateRequest = req.body;
      if (!sharedUserExchangeKeyRequest) {
        res.status(400).json({ error: "Missing request body" });
        return;
      }
      if (!sharedUserExchangeKeyRequest.requestFromUserInfo) {
        res.status(400).json({ error: "Missing requestFromUserInfo" });
        return;
      }
      if (!sharedUserExchangeKeyRequest.requestToUserInfo) {
        res.status(400).json({ error: "Missing requestToUserInfo" });
        return;
      }
      if (!sharedUserExchangeKeyRequest.requestFromUserInfo.id) {
        res.status(400).json({ error: "Missing requestFromUserInfo.id" });
        return;
      }
      if (!sharedUserExchangeKeyRequest.requestToUserInfo.id) {
        res.status(400).json({ error: "Missing requestToUserInfo.id" });
        return;
      }
      if (!sharedUserExchangeKeyRequest.signature) {
        res.status(400).json({ error: "Missing signature" });
        return;
      }
      if (!sharedUserExchangeKeyRequest.timestamp) {
        res.status(400).json({ error: "Missing timestamp" });
        return;
      }
      this.validateTimestamp(sharedUserExchangeKeyRequest.timestamp);
      await this.sharedUserService.validateRemotePublicKey(sharedUserExchangeKeyRequest);
      res.status(200).json({ message: "Public key validated" });
    } catch (error: unknown) {
      next(error);
    }
  }

  async getSession(req: Request, res: Response, next: NextFunction) {
    try {
      const sessionRequest: SessionRequestDTO = req.body;
      if (!sessionRequest) {
        res.status(400).json({ error: "Missing request body" });
        return;
      }
      if (!sessionRequest.requestFromUserInfo || !sessionRequest.requestToUserInfo) {
        res.status(400).json({ error: "Missing requestFromUserInfo or requestToUserInfo" });
        return;
      }
      if (!sessionRequest.requestFromUserInfo.id || !sessionRequest.requestToUserInfo.id) {
        res.status(400).json({ error: "Missing requestFromUserInfo.id or requestToUserInfo.id" });
        return;
      }
      if (!sessionRequest.signature) {
        res.status(400).json({ error: "Missing signature" });
        return;
      }
      this.validateTimestamp(sessionRequest.timestamp);
      const session = await this.sharedUserService.getSession(sessionRequest);
      res.status(200).json(session);
    } catch (err: unknown) {
      next(err);
    }
  }

  async requestSharedUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.body.user.id;
      const sharedUserContextRequest: SharedUserContextRequestDTO = req.body;
      if (!sharedUserContextRequest) {
        res.status(400).json({ error: "Missing request body" });
        return;
      }
      if (!sharedUserContextRequest.requestToUserInfo) {
        res.status(400).json({ error: "Missing requestToUserInfo" });
        return;
      }
      if (!sharedUserContextRequest.requestToUserInfo.id) {
        res.status(400).json({ error: "Missing requestToUserInfo.id" });
        return;
      }
      if (!sharedUserContextRequest.requestUrl) {
        res.status(400).json({ error: "Missing requestUrl" });
        return;
      }
      if (!sharedUserContextRequest.requestMethod) {
        res.status(400).json({ error: "Missing requestMethod" });
        return;
      }
      await this.sharedUserService.requestSharedUser(userId, sharedUserContextRequest);
      res.status(200).json({ message: "Shared user requested" });
    } catch (error: unknown) {
      next(error);
    }
  }

  private validateTimestamp(timestamp: number) {
    const currentTime = Date.now();
    const timeDifference = Math.abs(currentTime - timestamp);
    const fiveMinutesInMillis = 5 * 60 * 1000;

    if (timeDifference > fiveMinutesInMillis) {
      throw new PhotoBlogError("Timestamp is invalid: either too old or in the future", 500);
    }
  }
}