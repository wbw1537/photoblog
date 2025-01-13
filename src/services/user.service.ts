import { PrismaClient } from '@prisma/client/extension';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { User } from '../models/user.model.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export class UserService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async register(user: User) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const newUser = await this.prisma.user.create({
      data: {
        name: user.name,
        password: hashedPassword,
        email: user.email,
      }
    });
    return newUser;
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: email
      }
    });
    if (!user) {
      throw new Error('User not found');
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new Error('Invalid password');
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '1h'
    });
    return token;
  }
}