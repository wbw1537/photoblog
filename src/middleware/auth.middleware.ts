import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import log4js from 'log4js';
import { verifySharedUserToken, verifyToken } from '../utils/jwt.util.js';
import { SharedUserRepository } from '../repositories/shared-user.repository.js';

export class AuthMiddleware {
  constructor(
    private logger: log4js.Logger,
    private sharedUserRepository: SharedUserRepository,
  ) {
  }

  authenticate = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer')) {
      try {
        const token = authHeader.split(' ')[1];
        const user = verifyToken(token);
        req.body.user = user;
        next();
      } catch (error) {
        this.logger.error('JWT verification failed:', error);
        res.status(401).json({ message: 'JWT token invalid' });
      }
    } else {
      this.logger.error('No authorization provided');
      res.status(401).json({ message: 'Not authorized' });
    }
  });

  authenticateSharedUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer')) {
      try {
        const token = authHeader.split(' ')[1];
        const sharedUserId = req.body.requestFromUserInfo.id;
        const userId = req.body.requestToUserInfo.id;
        // Get sharedUser
        const sharedUser = await this.sharedUserRepository.findBySharedUserId(userId, sharedUserId);
        if (!sharedUser) {
          this.logger.error('Shared user not found');
          res.status(401).json({ message: 'Shared user not found' });
          return;
        }
        // Verify token
        const user = verifySharedUserToken(token, sharedUser.sharedUserPublicKey);
        req.body.user = user;
        next();
      } catch (error) {
        this.logger.error('JWT verification failed:', error);
        res.status(401).json({ message: 'JWT token invalid' });
      }
    } else {
      this.logger.error('No authorization provided');
      res.status(401).json({ message: 'Not authorized' });
    }
  });
}