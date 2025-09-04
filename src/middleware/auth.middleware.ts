import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import log4js from 'log4js';

import { verifyToken } from '../utils/jwt.util.js';

export class AuthMiddleware {
  constructor(
    private logger: log4js.Logger,
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
}