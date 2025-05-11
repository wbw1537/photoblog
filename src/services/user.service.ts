import bcrypt from 'bcrypt';
import crypto from 'crypto';

import { CreateUserDTO, TokenResponseDTO, UserLoginResponseDTO, UserInfoDTO, PublicUserInfoDTO, ModifyUserInfoRequestDTO } from '../models/user.model.js';
import { generateAccessToken, generateRefreshToken, shouldRenewRefreshToken, verifyToken } from '../utils/jwt.util.js';
import { UserRepository } from '../repositories/user.repository.js';

import { PhotoBlogError } from '../errors/photoblog.error.js';
export class UserService {
  constructor(
    private userRepository: UserRepository
  ) { }

  async checkUserExists(email: string): Promise<boolean> {
    const user = await this.userRepository.findByEmail(email);
    return !!user;
  }

  async register(user: CreateUserDTO): Promise<UserInfoDTO> {
    // Check if the email already exists
    const existingUser = await this.userRepository.findByEmail(user.email);
    if (existingUser) {
      throw new PhotoBlogError('Email already exists', 409);
    }
    const hashedPassword = await bcrypt.hash(user.password, 10);
    user.password = hashedPassword;
    // Create a new key pair for the user
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
    });
    // Export the keys as PEM strings
    const publicKeyString = publicKey.export({ type: 'pkcs1', format: 'pem' }).toString();
    const privateKeyString = privateKey.export({ type: 'pkcs1', format: 'pem' }).toString();
    const newUser = await this.userRepository.create(user, publicKeyString, privateKeyString);
    const userResponse: UserInfoDTO = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      type: newUser.type,
      address: newUser.address,
      basePath: newUser.basePath,
      cachePath: newUser.cachePath,
    };
    return userResponse;
  }

  async login(email: string, password: string): Promise<UserLoginResponseDTO> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new PhotoBlogError('Login credential failed', 403);
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new PhotoBlogError('Login credential failed', 403);
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const userResponse: UserLoginResponseDTO = {
      id: user.id,
      name: user.name,
      email: user.email,
      type: user.type,
      address: user.address,
      basePath: user.basePath,
      cachePath: user.cachePath,
      accessToken,
      refreshToken,
    };
    return userResponse;
  }

  async getUserInfo(userId: string): Promise<UserInfoDTO> {
    const user = await this.getUserById(userId);
    const userResponse: UserInfoDTO = {
      id: user.id,
      name: user.name,
      email: user.email,
      type: user.type,
      address: user.address,
      basePath: user.basePath,
      cachePath: user.cachePath,
    };
    return userResponse;
  }

  async modifyUserInfo(userId: string, modifyRequest: Partial<ModifyUserInfoRequestDTO>): Promise<UserInfoDTO> {
    if (modifyRequest.password) {
      const hashedPassword = await bcrypt.hash(modifyRequest.password, 10);
      modifyRequest.password = hashedPassword;
    }
    if (modifyRequest.email) {
      const existingUser = await this.userRepository.findByEmail(modifyRequest.email);
      if (existingUser && existingUser.id !== userId) {
        throw new PhotoBlogError('Email already exists', 409);
      }
    }
    const updatedUser = await this.userRepository.update(userId, modifyRequest);
    const userResponse: UserInfoDTO = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      type: updatedUser.type,
      address: updatedUser.address,
      basePath: updatedUser.basePath,
      cachePath: updatedUser.cachePath,
    };
    return userResponse;
  }


  async refreshToken(refreshToken: string): Promise<TokenResponseDTO> {
    const user = verifyToken(refreshToken);
    const accessToken = generateAccessToken(user);
    if (shouldRenewRefreshToken(refreshToken)) {
      const newRefreshToken = generateRefreshToken(user);
      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    }
    return {
      accessToken,
    };
  }

  async getUsers(skip: number, take: number): Promise<PublicUserInfoDTO[]> {
    const users = await this.userRepository.findAll(skip, take);
    return users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      address: user.address,
    }));
  }

  private async getUserById(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new PhotoBlogError('User not found', 404);
    }
    return user;
  }
}