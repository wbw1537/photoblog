import jwt from 'jsonwebtoken';

import { User } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1h';

export function generateToken(id: string, email: string) {
  return jwt.sign({ id, email }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
};

export function verifyToken(token: string): User {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded as User;
  } catch (error) {
    console.error("JWT failed when verify", error);
    throw error;
  }
}