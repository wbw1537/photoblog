import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';

import { verifyToken } from '../utils/jwt.util.js';

export const authenticate = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer')) {
    try {
      const token = authHeader.split(' ')[1];
      const user = verifyToken(token);
      req.body.user = user;
      next();
    } catch (error) {
      res.status(401).json({ message: 'JWT failed' });
    }
  } else {
    console.error("No authorization provided");
    res.status(401).json({ message: 'Not authorized' });
  }
});
