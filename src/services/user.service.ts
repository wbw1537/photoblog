import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcrypt';

import { CreateUserDTO } from '../models/user.model.js';
import { generateToken } from '../utils/jwt.util.js';
import { UserRepository } from '../repositories/user.repository.js';

export class UserService {
  private prisma: PrismaClient;
  private userRepository: UserRepository

  constructor(prisma: PrismaClient, userRepository: UserRepository) {
    this.prisma = prisma;
    this.userRepository = userRepository;
  }

  async register(user: CreateUserDTO): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    user.password = hashedPassword;
    try {
      const newUser = await this.userRepository.create(user);
      return newUser;
    } catch (error) {
      throw new Error('Error while creating user');
    }
  }

  async login(email: string, password: string): Promise<string> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new Error('Invalid password');
    }
    return generateToken(user.id, user.email);
  }
}