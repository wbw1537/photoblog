import { User } from '@prisma/client';
import bcrypt from 'bcrypt';


import { CreateUserDTO } from '../models/user.model.js';
import { generateToken } from '../utils/jwt.util.js';
import { UserRepository } from '../repositories/user.repository.js';

import { PhotoBlogError } from '../errors/photoblog.error.js';

export class UserService {
  constructor(
    private userRepository: UserRepository
  ) { }

  async register(user: CreateUserDTO): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    user.password = hashedPassword;
    const newUser = await this.userRepository.create(user);
    return newUser;
  }

  async login(email: string, password: string): Promise<string> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new PhotoBlogError('Login credential failed', 404);
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new PhotoBlogError('Login credential failed', 404);
    }
    return generateToken(user.id, user.email, user.basePath);
  }
}