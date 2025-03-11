import jwt, { JwtPayload } from 'jsonwebtoken';
import log4js from "log4js";

import { User } from '@prisma/client';
import { Token } from '../models/user.model.js';
import { PhotoBlogError } from '../errors/photoblog.error.js';


const logger = log4js.getLogger();

const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret';
const ACCESS_TOKEN_EXPIRATION = '30m'; // 30 minutes
const REFRESH_TOKEN_EXPIRATION = '14d'; // 2 weeks

const RENEW_REFRESH_TOKEN_TIME_SLOT = 7 * 24 * 60 * 60 * 1000; // 7 days

export function generateAccessToken(id: string, email: string, basePath: string): Token {
  const token = jwt.sign({ id, email, basePath }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRATION });
  const expiresAt = Date.now() + (30 * 60 * 1000);
  
  return {
    token,
    expiresAt,
    tokenType: 'Bearer'
  };
}

export function generateRefreshToken(id: string, email: string, basePath: string): Token {
  const token = jwt.sign({ id, email, basePath }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRATION });
  const expiresAt = Date.now() + (14 * 24 * 60 * 60 * 1000);
  
  return {
    token,
    expiresAt,
    tokenType: 'Bearer'
  };
}

export function verifyToken(token: string): User {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded as User;
  } catch (error) {
    logger.error('JWT verification failed:', error);
    throw error;
  }
}

export function shouldRenewRefreshToken(refreshToken: string): boolean {
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as JwtPayload;
    const currentTime = Date.now();
    const expireTime = decoded.exp ? decoded.exp * 1000 : 0; // Convert iat from seconds to milliseconds

    if (expireTime === 0) {
      throw new PhotoBlogError('Invalid token: missing issue time', 400);
    }

    return (expireTime - currentTime) < RENEW_REFRESH_TOKEN_TIME_SLOT;
  } catch (error) {
    logger.error('JWT verification failed:', error);
    throw error;
  }
}