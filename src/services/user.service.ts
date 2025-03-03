import bcrypt from 'bcrypt';


import { CreateUserDTO, UserLoginResponseDTO, UserResponseDTO } from '../models/user.model.js';
import { generateToken } from '../utils/jwt.util.js';
import { UserRepository } from '../repositories/user.repository.js';

import { PhotoBlogError } from '../errors/photoblog.error.js';

export class UserService {
  constructor(
    private userRepository: UserRepository
  ) { }

  async register(user: CreateUserDTO): Promise<UserResponseDTO> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    user.password = hashedPassword;
    const newUser = await this.userRepository.create(user);
    const userResponse: UserResponseDTO = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      admin: newUser.admin,
      basePath: newUser.basePath,
    };
    return userResponse;
  }

  async login(email: string, password: string): Promise<UserLoginResponseDTO> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new PhotoBlogError('Login credential failed', 404);
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new PhotoBlogError('Login credential failed', 404);
    }
    const token = generateToken(user.id, user.email, user.basePath);
    const userResponse: UserLoginResponseDTO = {
      id: user.id,
      name: user.name,
      email: user.email,
      admin: user.admin,
      basePath: user.basePath,
      token,
    };
    return userResponse;
  }
}