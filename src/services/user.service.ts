import { User } from '@prisma/client';
import bcrypt from 'bcrypt';
import { Logger } from 'log4js';


import { CreateUserDTO } from '../models/user.model.js';
import { generateToken } from '../utils/jwt.util.js';
import { UserRepository } from '../repositories/user.repository.js';

export class UserService {
  constructor(
    private userRepository: UserRepository,
    private logger: Logger
  ) { }

  async register(user: CreateUserDTO): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    user.password = hashedPassword;
    try {
      const newUser = await this.userRepository.create(user);
      return newUser;
    } catch (error) {
      this.logger.error(error);
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