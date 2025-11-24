import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

import { UserService } from './user.service.js';
import { UserRepository } from '../repositories/user.repository.js';
import { PhotoBlogError } from '../errors/photoblog.error.js';
import { generateAccessToken, generateRefreshToken, verifyToken, shouldRenewRefreshToken } from '../utils/jwt.util.js';
import { UserType } from '@prisma/client';

// Mock dependencies
vi.mock('../repositories/user.repository.js');
vi.mock('bcrypt');
vi.mock('crypto');
vi.mock('../utils/jwt.util.js');

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: any;

  const mockUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    type: UserType.LOCAL,
    instanceUrl: 'http://localhost:3000',
    localUser: {
      basePath: '/test/base',
      cachePath: '/test/cache',
      password: 'hashedpassword',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUserRepository = {
      findLocalUserByEmail: vi.fn(),
      createLocalUser: vi.fn(),
      findLocalUserById: vi.fn(),
      update: vi.fn(),
      findAll: vi.fn(),
    };
    userService = new UserService(mockUserRepository);

    // Mock functions
    vi.mocked(bcrypt.hash).mockResolvedValue('hashedpassword');
    vi.mocked(bcrypt.compare).mockResolvedValue(true);
    vi.mocked(crypto.generateKeyPairSync).mockReturnValue({
      publicKey: {
        export: vi.fn(() => 'publickey-pem'),
      } as any,
      privateKey: {
        export: vi.fn(() => 'privatekey-pem'),
      } as any,
    } as any);
    vi.mocked(generateAccessToken).mockReturnValue('accesstoken');
    vi.mocked(generateRefreshToken).mockReturnValue('refreshtoken');
    vi.mocked(verifyToken).mockReturnValue({ id: 'user-1' });
    vi.mocked(shouldRenewRefreshToken).mockReturnValue(false);
  });

  describe('checkUserExists', () => {
    it('should return true if user exists', async () => {
      mockUserRepository.findLocalUserByEmail.mockResolvedValue(mockUser);
      const exists = await userService.checkUserExists('test@example.com');
      expect(exists).toBe(true);
      expect(mockUserRepository.findLocalUserByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should return false if user does not exist', async () => {
      mockUserRepository.findLocalUserByEmail.mockResolvedValue(null);
      const exists = await userService.checkUserExists('test@example.com');
      expect(exists).toBe(false);
    });
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      mockUserRepository.findLocalUserByEmail.mockResolvedValue(null);
      mockUserRepository.createLocalUser.mockResolvedValue(mockUser);
      vi.spyOn(String.prototype, 'toString').mockReturnValue('pem-key');


      const newUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };
      const result = await userService.register(newUser);

      expect(result).toEqual({
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        type: UserType.LOCAL,
        instanceUrl: 'http://localhost:3000',
        basePath: '/test/base',
        cachePath: '/test/cache',
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(crypto.generateKeyPairSync).toHaveBeenCalled();
      expect(mockUserRepository.createLocalUser).toHaveBeenCalled();
    });

    it('should throw an error if email already exists', async () => {
      mockUserRepository.findLocalUserByEmail.mockResolvedValue(mockUser);
      const newUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };
      await expect(userService.register(newUser)).rejects.toThrow(new PhotoBlogError('Email already exists', 409));
    });
  });

  describe('login', () => {
    it('should login successfully and return tokens', async () => {
      mockUserRepository.findLocalUserByEmail.mockResolvedValue(mockUser);
      const result = await userService.login('test@example.com', 'password123');

      expect(result.accessToken).toBe('accesstoken');
      expect(result.refreshToken).toBe('refreshtoken');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
    });

    it('should throw an error for invalid credentials', async () => {
      mockUserRepository.findLocalUserByEmail.mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(false);

      await expect(userService.login('test@example.com', 'wrongpassword')).rejects.toThrow(new PhotoBlogError('Login credential failed', 403));
    });
  });

  describe('getUserInfo', () => {
    it('should return user info for a valid user ID', async () => {
      mockUserRepository.findLocalUserById.mockResolvedValue(mockUser);
      const result = await userService.getUserInfo('user-1');
      expect(result.name).toBe('Test User');
      expect(mockUserRepository.findLocalUserById).toHaveBeenCalledWith('user-1');
    });

    it('should throw an error if user not found', async () => {
      mockUserRepository.findLocalUserById.mockResolvedValue(null);
      await expect(userService.getUserInfo('user-1')).rejects.toThrow(new PhotoBlogError('User not found', 404));
    });
  });

  describe('modifyUserInfo', () => {
    it('should modify user info successfully', async () => {
      const updatedUser = { ...mockUser, name: 'Updated Name' };
      mockUserRepository.update.mockResolvedValue(updatedUser);

      const result = await userService.modifyUserInfo('user-1', { name: 'Updated Name' });
      expect(result.name).toBe('Updated Name');
      expect(mockUserRepository.update).toHaveBeenCalledWith('user-1', { name: 'Updated Name' });
    });

    it('should hash password if provided', async () => {
      mockUserRepository.update.mockResolvedValue({
        id: 'user-1',
        name: 'Updated Name',
        email: 'test@example.com',
        type: UserType.LOCAL,
        instanceUrl: 'http://localhost:3000',
        localUser: {
          basePath: '/test/base',
          cachePath: '/test/cache',
          password: 'newhashedpassword',
        },
      });
      await userService.modifyUserInfo('user-1', { password: 'newpassword' });
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword', 10);
    });
  });

  describe('refreshToken', () => {
    it('should return a new access token', async () => {
      mockUserRepository.findLocalUserById.mockResolvedValue(mockUser);
      const result = await userService.refreshToken('refreshtoken');
      expect(result.accessToken).toBe('accesstoken');
      expect(result.refreshToken).toBeUndefined();
    });

    it('should return a new refresh token if it should be renewed', async () => {
      vi.mocked(shouldRenewRefreshToken).mockReturnValue(true);
      mockUserRepository.findLocalUserById.mockResolvedValue(mockUser);
      vi.mocked(generateRefreshToken).mockReturnValue('newrefreshtoken');

      const result = await userService.refreshToken('refreshtoken');
      expect(result.accessToken).toBe('accesstoken');
      expect(result.refreshToken).toBe('newrefreshtoken');
    });
  });

  describe('getUsers', () => {
    it('should return a list of public user info', async () => {
      const users = [mockUser, { ...mockUser, id: 'user-2', email: 'test2@example.com' }];
      mockUserRepository.findAll.mockResolvedValue(users);

      const result = await userService.getUsers();
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Test User');
      expect(result[0]).not.toHaveProperty('localUser');
    });
  });
});
