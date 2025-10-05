import { NextFunction, Request, Response } from "express";

import { GetRelationshipsRequestDTO, SharedUserContextRequestDTO, SharedUserExchangeKeyRequest, SharedUserInitRemoteRequestDTO, SharedUserInitRequestDTO, SharedUserValidateRequest } from "../models/shared-user.model.js";
import { SharedUserService } from "../services/shared-user.service.js";
import { PhotoBlogError } from "../errors/photoblog.error.js";
import { SessionRequestDTO } from "../models/shared-user.model.js";

export class SharedUserController {
  constructor(
    private sharedUserService: SharedUserService
  ) { }

  async getRelationships(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.body.user.id;
      const getRelationshipsRequest: GetRelationshipsRequestDTO = {
        name: req.query.name as string,
        email: req.query.email as string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: req.query.status as any, // Cast to any to avoid type errors, service layer will handle validation
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        direction: req.query.direction as any,
        skip: parseInt(req.query.skip as string) || 0,
        take: parseInt(req.query.take as string) || 10,
      }
      const sharedUsers = await this.sharedUserService.getSharedUsers(userId, getRelationshipsRequest);
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

  async initiateRemoteRelationship(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.body.user.id;
      const sharedUserInitRequest: SharedUserInitRequestDTO = req.body;
      const response = await this.sharedUserService.initiateRemoteRelationship(userId, sharedUserInitRequest);
      res.status(201).json(response);
    } catch (error: unknown) {
      next(error);
    }
  }

  async receiveRemoteRelationshipRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const sharedUserRequest: SharedUserInitRemoteRequestDTO = req.body;
      // Basic validation
      if (!sharedUserRequest?.requestFromUserInfo?.id || !sharedUserRequest?.requestToUserInfo?.id) {
        return res.status(400).json({ error: "Missing required user info fields" });
      }
      this.validateTimestamp(sharedUserRequest.timestamp);
      const response = await this.sharedUserService.receiveRemoteRelationshipRequest(sharedUserRequest);
      res.status(201).json(response);
    } catch (error: unknown) {
      next(error);
    }
  }

  async approveRelationship(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.body.user.id;
      const relationshipId = req.params.id;
      const response = await this.sharedUserService.approveSharingRequest(userId, relationshipId);
      res.status(200).json(response);
    } catch (error: unknown) {
      next(error);
    }
  }

  async blockRelationship(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.body.user.id;
      const relationshipId = req.params.id;
      const response = await this.sharedUserService.blockRelationship(userId, relationshipId);
      res.status(200).json(response);
    } catch (error: unknown) {
      next(error);
    }
  }

  async exchangeRemotePublicKey(req: Request, res: Response, next: NextFunction) {
    try {
      const sharedUserExchangeKeyRequest: SharedUserExchangeKeyRequest = req.body;
      if (!sharedUserExchangeKeyRequest?.requestFromUserInfo?.id || !sharedUserExchangeKeyRequest?.requestToUserInfo?.id) {
        return res.status(400).json({ error: "Missing user info in request" });
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
      const sharedUserValidateRequest: SharedUserValidateRequest = req.body;
      if (!sharedUserValidateRequest?.requestFromUserInfo?.id || !sharedUserValidateRequest?.requestToUserInfo?.id) {
        return res.status(400).json({ error: "Missing user info in request" });
      }
      this.validateTimestamp(sharedUserValidateRequest.timestamp);
      await this.sharedUserService.validateRemotePublicKey(sharedUserValidateRequest);
      res.status(200).json({ message: "Public key validated" });
    } catch (error: unknown) {
      next(error);
    }
  }

  async getSession(req: Request, res: Response, next: NextFunction) {
    try {
      const sessionRequest: SessionRequestDTO = req.body;
      if (!sessionRequest?.requestFromUserInfo?.id || !sessionRequest?.requestToUserInfo?.id) {
        return res.status(400).json({ error: "Missing user info in request" });
      }
      this.validateTimestamp(sessionRequest.timestamp);
      const session = await this.sharedUserService.getSession(sessionRequest);
      res.status(200).json(session);
    } catch (err: unknown) {
      next(err);
    }
  }

  async proxyRequestToRemote(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.body.user.id;
      const sharedUserContextRequest: SharedUserContextRequestDTO = req.body;
      if (!sharedUserContextRequest?.requestToUserInfo?.id || !sharedUserContextRequest.requestUrl) {
        return res.status(400).json({ error: "Missing required fields for proxying" });
      }
      
      const response = await this.sharedUserService.requestSharedUser(userId, sharedUserContextRequest);
      
      if (response && typeof response.arrayBuffer === 'function' && typeof response.headers === 'object') {
        const contentType = response.headers.get('Content-Type');
        if (contentType) {
          res.set('Content-Type', contentType);
        }
        const arrayBuffer = await response.arrayBuffer();
        res.send(Buffer.from(arrayBuffer));
      } else {
        res.status(200).json(response);
      }
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
