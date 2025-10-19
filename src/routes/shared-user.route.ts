import express, { NextFunction, Request, Response, RequestHandler } from 'express';
import { GetRelationshipsRequestDTO, SharedUserContextRequestDTO, SharedUserExchangeKeyRequest, SharedUserInitRemoteRequestDTO, SharedUserInitRequestDTO, SharedUserValidateRequest, SessionRequestDTO } from "../models/shared-user.model.js";
import { SharedUserService } from "../services/shared-user.service.js";
import { PhotoBlogError } from "../errors/photoblog.error.js";

export function createSharedUserRouter(
  sharedUserService: SharedUserService,
  authenticate: RequestHandler
) {
  const sharedUserRouter = express.Router();

  const validateTimestamp = (timestamp: number) => {
    const currentTime = Date.now();
    const timeDifference = Math.abs(currentTime - timestamp);
    const fiveMinutesInMillis = 5 * 60 * 1000;

    if (timeDifference > fiveMinutesInMillis) {
      throw new PhotoBlogError("Timestamp is invalid: either too old or in the future", 500);
    }
  };

  // Get all relationships for the current user
  sharedUserRouter.get('/v1/shared-user', authenticate, async (req: Request, res: Response, next: NextFunction) => {
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
      const sharedUsers = await sharedUserService.getSharedUsers(userId, getRelationshipsRequest);
      res.status(200).json(sharedUsers);
    } catch (error: unknown) {
      next(error);
    }
  });

  // Fetch public user info from a remote instance
  sharedUserRouter.get('/v1/shared-user/fetch-remote', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const remoteAddress = req.query.remoteAddress as string;
      if (!remoteAddress) {
        throw new PhotoBlogError("Missing remoteAddress query", 400);
      }
      const remoteUsers = await sharedUserService.fetchRemoteUsers(remoteAddress);
      res.status(200).json(remoteUsers);
    } catch (error: unknown) {
      next(error);
    }
  });

  // Initiate a relationship with a remote user
  sharedUserRouter.post('/v1/shared-user/init', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.body.user.id;
      const sharedUserInitRequest: SharedUserInitRequestDTO = req.body;
      const response = await sharedUserService.initiateRemoteRelationship(userId, sharedUserInitRequest);
      res.status(201).json(response);
    } catch (error: unknown) {
      next(error);
    }
  });

  // Approve a pending incoming relationship
  sharedUserRouter.post('/v1/shared-user/approve/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.body.user.id;
      const relationshipId = req.params.id;
      const response = await sharedUserService.approveSharingRequest(userId, relationshipId);
      res.status(200).json(response);
    } catch (error: unknown) {
      next(error);
    }
  });

  // Block an active relationship
  sharedUserRouter.post('/v1/shared-user/block/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.body.user.id;
      const relationshipId = req.params.id;
      const response = await sharedUserService.blockRelationship(userId, relationshipId);
      res.status(200).json(response);
    } catch (error: unknown) {
      next(error);
    }
  });

  // Proxy a request to a remote user's instance
  sharedUserRouter.post('/v1/shared-user/request', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.body.user.id;
      const sharedUserContextRequest: SharedUserContextRequestDTO = req.body;
      if (!sharedUserContextRequest?.requestToUserInfo?.id || !sharedUserContextRequest.requestUrl) {
        throw new PhotoBlogError("Missing required fields for proxying", 400);
      }

      const response = await sharedUserService.requestSharedUser(userId, sharedUserContextRequest);

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
  });

  // --- Public routes for inter-instance communication ---

  // Endpoint for a remote instance to initiate a relationship with a local user
  sharedUserRouter.post('/public/v1/shared-user/init', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sharedUserRequest: SharedUserInitRemoteRequestDTO = req.body;
      // Basic validation
      if (!sharedUserRequest?.requestFromUserInfo?.id || !sharedUserRequest?.requestToUserInfo?.id) {
        throw new PhotoBlogError("Missing required user info fields", 400);
      }
      validateTimestamp(sharedUserRequest.timestamp);
      const response = await sharedUserService.receiveRemoteRelationshipRequest(sharedUserRequest);
      res.status(201).json(response);
    } catch (error: unknown) {
      next(error);
    }
  });

  // Endpoint for the key exchange part of the handshake
  sharedUserRouter.post('/public/v1/shared-user/exchange', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sharedUserExchangeKeyRequest: SharedUserExchangeKeyRequest = req.body;
      if (!sharedUserExchangeKeyRequest?.requestFromUserInfo?.id || !sharedUserExchangeKeyRequest?.requestToUserInfo?.id) {
        throw new PhotoBlogError("Missing user info in request", 400);
      }
      validateTimestamp(sharedUserExchangeKeyRequest.timestamp);
      const response = await sharedUserService.exchangeRemotePublicKey(sharedUserExchangeKeyRequest);
      res.status(200).json(response);
    } catch (error: unknown) {
      next(error);
    }
  });

  // Endpoint for the signature validation part of the handshake
  sharedUserRouter.post('/public/v1/shared-user/validate', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sharedUserValidateRequest: SharedUserValidateRequest = req.body;
      if (!sharedUserValidateRequest?.requestFromUserInfo?.id || !sharedUserValidateRequest?.requestToUserInfo?.id) {
        throw new PhotoBlogError("Missing user info in request", 400);
      }
      validateTimestamp(sharedUserValidateRequest.timestamp);
      await sharedUserService.validateRemotePublicKey(sharedUserValidateRequest);
      res.status(200).json({ message: "Public key validated" });
    } catch (error: unknown) {
      next(error);
    }
  });

  // Endpoint for a remote user to get a session token
  sharedUserRouter.post('/public/v1/shared-user/session', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionRequest: SessionRequestDTO = req.body;
      if (!sessionRequest?.requestFromUserInfo?.id || !sessionRequest?.requestToUserInfo?.id) {
        throw new PhotoBlogError("Missing user info in request", 400);
      }
      validateTimestamp(sessionRequest.timestamp);
      const session = await sharedUserService.getSession(sessionRequest);
      res.status(200).json(session);
    } catch (err: unknown) {
      next(err);
    }
  });

  return sharedUserRouter;
}