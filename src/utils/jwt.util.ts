import jwt, { JwtPayload } from 'jsonwebtoken';
import log4js from "log4js";

import { User } from '@prisma/client';
import { Token, UserInfoDTO } from '../models/user.model.js';
import { PhotoBlogError } from '../errors/photoblog.error.js';
import { UserJwtPayloadWithSession } from '../models/shared-user.model.js';


const logger = log4js.getLogger();

const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret';
const ACCESS_TOKEN_EXPIRATION = '30m'; // 30 minutes
const REFRESH_TOKEN_EXPIRATION = '14d'; // 2 weeks

const RENEW_REFRESH_TOKEN_TIME_SLOT = 7 * 24 * 60 * 60 * 1000; // 7 days
const SHARED_USER_RENEW_REFRESH_TOKEN_TIME_SLOT = 1 * 24 * 60 * 60 * 1000; // 1 days

function generateUtilizedToken(sign: object, expiresIn: string, jwtSecret: string): Token {
  const token = jwt.sign(sign, jwtSecret, { expiresIn: expiresIn });
  const expiresAt = convertExpireInToMillis(expiresIn) + Date.now();

  return {
    token,
    expiresAt,
    tokenType: 'Bearer'
  };
}

export function generateAccessToken(user: User): Token {
  const userPayload: UserInfoDTO = {
    id: user.id,
    name: user.name,
    email: user.email,
    type: user.type,
    address: user.address,
    basePath: user.basePath,
    cachePath: user.cachePath
  };
  return generateUtilizedToken(userPayload, ACCESS_TOKEN_EXPIRATION, JWT_SECRET);
}

export function generateAccessTokenForSharedUser(userWithSession: UserJwtPayloadWithSession): Token {
  const userPayload: UserJwtPayloadWithSession = {
    id: userWithSession.id,
    name: userWithSession.name,
    email: userWithSession.email,
    type: userWithSession.type,
    address: userWithSession.address,
    basePath: userWithSession.basePath,
    cachePath: userWithSession.cachePath,
    session: userWithSession.session
  };
  return generateUtilizedToken(userPayload, ACCESS_TOKEN_EXPIRATION, JWT_SECRET);
}

export function generateRefreshToken(user: User): Token {
  const userPayload: UserInfoDTO = {
    id: user.id,
    name: user.name,
    email: user.email,
    type: user.type,
    address: user.address,
    basePath: user.basePath,
    cachePath: user.cachePath
  };
  return generateUtilizedToken(userPayload, REFRESH_TOKEN_EXPIRATION, JWT_SECRET);
}

export function verifyUtilizedToken(token: string, jwtSecret: string): User {
  try {
    const decoded = jwt.verify(token, jwtSecret);
    return decoded as User;
  } catch (error) {
    logger.error('JWT verification failed:', error);
    throw error;
  }
}

export function verifyToken(token: string): User {
  return verifyUtilizedToken(token, JWT_SECRET);
}

export function verifySharedUserToken(token: string, jwtSecret: string): User {
  return verifyUtilizedToken(token, jwtSecret);
}

export function calculateAvailableTime(token: string): number {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const currentTime = Date.now();
    const expireTime = decoded.exp ? decoded.exp * 1000 : 0; // Convert iat from seconds to milliseconds

    if (expireTime === 0) {
      throw new PhotoBlogError('Invalid token: missing issue time', 400);
    }

    return expireTime - currentTime;
  } catch (error) {
    logger.error('JWT verification failed:', error);
    throw error;
  }
}

export function shouldRenewRefreshToken(refreshToken: string): boolean {
  return calculateAvailableTime(refreshToken) < RENEW_REFRESH_TOKEN_TIME_SLOT;
}

export function shouldRenewRefreshTokenForSharedUser(refreshToken: string): boolean {
  return calculateAvailableTime(refreshToken) < SHARED_USER_RENEW_REFRESH_TOKEN_TIME_SLOT;
}

function convertExpireInToMillis(expireIn: string): number {
  const timeUnit = expireIn.slice(-1);
  const timeValue = parseInt(expireIn.slice(0, -1), 10);

  switch (timeUnit) {
    case 's':
      return timeValue * 1000;
    case 'm':
      return timeValue * 60 * 1000;
    case 'h':
      return timeValue * 60 * 60 * 1000;
    case 'd':
      return timeValue * 24 * 60 * 60 * 1000;
    default:
      throw new Error('Invalid expiration time unit');
  }
}