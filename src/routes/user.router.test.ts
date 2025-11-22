import { describe, it, expect, vi, beforeEach } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';
import { createUserRouter } from './user.router.js';
import { UserService } from '../services/user.service.js';
import { PhotoBlogError } from '../errors/photoblog.error.js';

// Mock the UserService
vi.mock('../services/user.service.js', () => {
  return {
    UserService: vi.fn(),
  };
});

describe('User Router', () => {
  let app: Express;
  let mockUserService: any;
  let mockAuthenticate: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create mock service
    mockUserService = {
      register: vi.fn(),
      login: vi.fn(),
      checkUserExists: vi.fn(),
      getUserInfo: vi.fn(),
      modifyUserInfo: vi.fn(),
      refreshToken: vi.fn(),
      getUsers: vi.fn(),
    };

    // Create mock authenticate middleware
    mockAuthenticate = vi.fn((req, res, next) => {
      // Simulate authenticated user
      req.body.user = { id: 'test-user-id' };
      next();
    });

    // Create Express app with router
    app = express();
    app.use(express.json());
    app.use('/users', createUserRouter(mockUserService, mockAuthenticate));

    // Error handler middleware
    app.use((err: any, req: any, res: any, next: any) => {
      if (err instanceof PhotoBlogError) {
        res.status(err.statusCode).json({ error: err.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  });

  describe('POST /users/v1/register', () => {
    it('should register a new user successfully', async () => {
      const newUser = {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        type: 'LOCAL',
        instanceUrl: null,
        basePath: '/photos',
        cachePath: '/cache',
      };

      mockUserService.register.mockResolvedValue(newUser);

      const response = await request(app)
        .post('/users/v1/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(newUser);
      expect(mockUserService.register).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should return 409 when email already exists', async () => {
      mockUserService.register.mockRejectedValue(
        new PhotoBlogError('Email already exists', 409)
      );

      const response = await request(app)
        .post('/users/v1/register')
        .send({
          name: 'Test User',
          email: 'existing@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Email already exists');
    });
  });

  describe('POST /users/v1/login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginResponse = {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        type: 'LOCAL',
        instanceUrl: null,
        basePath: '/photos',
        cachePath: '/cache',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      mockUserService.login.mockResolvedValue(loginResponse);

      const response = await request(app)
        .post('/users/v1/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(loginResponse);
      expect(mockUserService.login).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      );
    });

    it('should return 403 with invalid credentials', async () => {
      mockUserService.login.mockRejectedValue(
        new PhotoBlogError('Login credential failed', 403)
      );

      const response = await request(app)
        .post('/users/v1/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Login credential failed');
    });
  });

  describe('POST /users/v1/email-availability', () => {
    it('should check if email exists', async () => {
      mockUserService.checkUserExists.mockResolvedValue(true);

      const response = await request(app)
        .post('/users/v1/email-availability')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ exists: true });
      expect(mockUserService.checkUserExists).toHaveBeenCalledWith('test@example.com');
    });

    it('should return 400 when email is missing', async () => {
      const response = await request(app)
        .post('/users/v1/email-availability')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email parameter is required');
    });

    it('should return 400 when email is not a string', async () => {
      const response = await request(app)
        .post('/users/v1/email-availability')
        .send({ email: 123 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email parameter is required');
    });
  });

  describe('GET /users/v1/user-info', () => {
    it('should get user info for authenticated user', async () => {
      const userInfo = {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
        type: 'LOCAL',
        instanceUrl: null,
        basePath: '/photos',
        cachePath: '/cache',
      };

      mockUserService.getUserInfo.mockResolvedValue(userInfo);

      const response = await request(app)
        .get('/users/v1/user-info');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(userInfo);
      expect(mockAuthenticate).toHaveBeenCalled();
      expect(mockUserService.getUserInfo).toHaveBeenCalledWith('test-user-id');
    });

    it('should return 404 when user not found', async () => {
      mockUserService.getUserInfo.mockRejectedValue(
        new PhotoBlogError('User not found', 404)
      );

      const response = await request(app)
        .get('/users/v1/user-info');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
    });
  });

  describe('PUT /users/v1/user-info', () => {
    it('should update user info', async () => {
      const updatedUser = {
        id: 'test-user-id',
        name: 'Updated Name',
        email: 'updated@example.com',
        type: 'LOCAL',
        instanceUrl: null,
        basePath: '/photos',
        cachePath: '/cache',
      };

      mockUserService.modifyUserInfo.mockResolvedValue(updatedUser);

      const response = await request(app)
        .put('/users/v1/user-info')
        .send({
          name: 'Updated Name',
          email: 'updated@example.com',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedUser);
      expect(mockUserService.modifyUserInfo).toHaveBeenCalledWith(
        'test-user-id',
        expect.objectContaining({
          name: 'Updated Name',
          email: 'updated@example.com',
        })
      );
    });
  });

  describe('POST /users/v1/refresh-token', () => {
    it('should refresh tokens successfully', async () => {
      const tokenResponse = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockUserService.refreshToken.mockResolvedValue(tokenResponse);

      const response = await request(app)
        .post('/users/v1/refresh-token')
        .send({ refreshToken: 'old-refresh-token' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(tokenResponse);
      expect(mockUserService.refreshToken).toHaveBeenCalledWith('old-refresh-token');
    });

    it('should return 400 when refresh token is missing', async () => {
      const response = await request(app)
        .post('/users/v1/refresh-token')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Refresh token is required');
    });

    it('should return 400 when refresh token is not a string', async () => {
      const response = await request(app)
        .post('/users/v1/refresh-token')
        .send({ refreshToken: 123 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Refresh token is required');
    });
  });

  describe('GET /users/public/v1/users', () => {
    it('should get list of all users', async () => {
      const users = [
        {
          id: '1',
          name: 'User 1',
          email: 'user1@example.com',
          instanceUrl: null,
        },
        {
          id: '2',
          name: 'User 2',
          email: 'user2@example.com',
          instanceUrl: null,
        },
      ];

      mockUserService.getUsers.mockResolvedValue(users);

      const response = await request(app)
        .get('/users/public/v1/users');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ users });
      expect(mockUserService.getUsers).toHaveBeenCalled();
    });
  });
});
