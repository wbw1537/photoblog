import bcrypt from 'bcrypt';
import crypto from 'crypto';

import { Logger } from 'log4js';
import { CreateUserDTO, TokenResponseDTO, UserLoginResponseDTO, UserInfoDTO, PublicUserInfoDTO, ModifyUserInfoRequestDTO } from '../models/user.model.js';
import { generateAccessToken, generateRefreshToken, shouldRenewRefreshToken, verifyToken } from '../utils/jwt.util.js';
import { UserRepository } from '../repositories/user.repository.js';

import { PhotoBlogError } from '../errors/photoblog.error.js';
export class UserService {
  constructor(
    private logger: Logger,
    private userRepository: UserRepository
  ) { }

  async checkUserExists(email: string): Promise<boolean> {
    const user = await this.userRepository.findLocalUserByEmail(email);
    return !!user;
  }

  async register(user: CreateUserDTO): Promise<UserInfoDTO> {
    // Check if the email already exists
    const existingUser = await this.userRepository.findLocalUserByEmail(user.email);
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
    const newUser = await this.userRepository.createLocalUser(user, publicKeyString, privateKeyString);
    const userResponse: UserInfoDTO = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      type: newUser.type,
      instanceUrl: newUser.instanceUrl,
      // Obviously localUser is not null
      basePath: newUser.localUser!.basePath,
      cachePath: newUser.localUser!.cachePath,
    };
    return userResponse;
  }

  async login(email: string, password: string): Promise<UserLoginResponseDTO> {
    const user = await this.validateLoginUser(email, password);

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const userResponse: UserLoginResponseDTO = {
      id: user.id,
      name: user.name,
      email: user.email,
      type: user.type,
      instanceUrl: user.instanceUrl,
      // Validated localUser non-null
      basePath: user.localUser!.basePath,
      cachePath: user.localUser!.cachePath,
      accessToken,
      refreshToken,
    };
    return userResponse;
  }

  private async validateLoginUser(email: string, password: string) {
   const user = await this.userRepository.findLocalUserByEmail(email);
    if (!user) {
      this.logger.error(`Login failed: User with email ${email} not found`);
      throw new PhotoBlogError('Login credential failed', 403);
    }
    if (!user.localUser) {
      this.logger.error(`Login failed: Local user property missing for email ${email}`);
      throw new PhotoBlogError('Local user property not found', 500);
    }
    const passwordMatch = await bcrypt.compare(password, user.localUser.password);
    if (!passwordMatch) {
      this.logger.error(`Login failed: Incorrect password for email ${email}`);
      throw new PhotoBlogError('Login credential failed', 403);
    }
    return user;
  }

  async getUserInfo(userId: string): Promise<UserInfoDTO> {
    const user = await this.getValidatedLocalUserById(userId);
    const userResponse: UserInfoDTO = {
      id: user.id,
      name: user.name,
      email: user.email,
      type: user.type,
      // Validated localUser non-null
      instanceUrl: user.instanceUrl,
      basePath: user.localUser!.basePath,
      cachePath: user.localUser!.cachePath,
    };
    return userResponse;
  }

  async modifyUserInfo(userId: string, modifyRequest: Partial<ModifyUserInfoRequestDTO>): Promise<UserInfoDTO> {
    if (modifyRequest.password) {
      const hashedPassword = await bcrypt.hash(modifyRequest.password, 10);
      modifyRequest.password = hashedPassword;
    }
    if (modifyRequest.email) {
      const existingUser = await this.userRepository.findLocalUserByEmail(modifyRequest.email);
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
      instanceUrl: updatedUser.instanceUrl,
      basePath: updatedUser.localUser!.basePath,
      cachePath: updatedUser.localUser!.cachePath,
    };
    return userResponse;
  }


  async refreshToken(refreshToken: string): Promise<TokenResponseDTO> {
    const tokenPayload = verifyToken(refreshToken);
    const user = await this.getValidatedLocalUserById(tokenPayload.id);
    
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

  async getUsers(): Promise<PublicUserInfoDTO[]> {
    const users = await this.userRepository.findAll();
    return users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      instanceUrl: user.instanceUrl,
    }));
  }

  private async getValidatedLocalUserById(userId: string) {
    const user = await this.userRepository.findLocalUserById(userId);
    if (!user) {
      throw new PhotoBlogError('User not found', 404);
    }
    if (!user.localUser) {
      throw new PhotoBlogError('Local user property not found', 500);
    }
    return user;
  }
}