
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';
import { createSharedUserRouter } from './shared-user.route.js';
import { SharedUserService } from '../services/shared-user.service.js';
import { PhotoBlogError } from '../errors/photoblog.error.js';

vi.mock('../services/shared-user.service.js');

describe('Shared User Router', () => {
  let app: Express;
  let mockSharedUserService: any;
  let mockAuthenticate: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSharedUserService = {
      getSharedUsers: vi.fn(),
      fetchRemoteUsers: vi.fn(),
      initiateRemoteRelationship: vi.fn(),
      approveSharingRequest: vi.fn(),
      blockRelationship: vi.fn(),
      requestSharedUser: vi.fn(),
      receiveRemoteRelationshipRequest: vi.fn(),
      exchangeRemotePublicKey: vi.fn(),
      validateRemotePublicKey: vi.fn(),
      getSession: vi.fn(),
    };

    mockAuthenticate = vi.fn((req, res, next) => {
      req.body.user = { id: 'test-user-id' };
      next();
    });

    app = express();
    app.use(express.json());
    app.use('/shared-user', createSharedUserRouter(mockSharedUserService, mockAuthenticate));

    app.use((err: any, req: any, res: any, next: any) => {
      if (err instanceof PhotoBlogError) {
        res.status(err.statusCode).json({ error: err.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  });

  describe('GET /v1/shared-user', () => {
    it('should get shared users successfully', async () => {
      const users = [{ id: '1', name: 'Shared User' }];
      mockSharedUserService.getSharedUsers.mockResolvedValue(users);

      const response = await request(app).get('/shared-user/v1/shared-user');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(users);
      expect(mockSharedUserService.getSharedUsers).toHaveBeenCalledWith('test-user-id', expect.any(Object));
    });
  });

  describe('GET /v1/shared-user/fetch-remote', () => {
    it('should fetch remote users successfully', async () => {
      const remoteUsers = [{ id: '1', name: 'Remote User' }];
      mockSharedUserService.fetchRemoteUsers.mockResolvedValue(remoteUsers);

      const response = await request(app).get('/shared-user/v1/shared-user/fetch-remote?remoteAddress=http://remote.com');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(remoteUsers);
      expect(mockSharedUserService.fetchRemoteUsers).toHaveBeenCalledWith('http://remote.com');
    });
  });

  describe('POST /v1/shared-user/init', () => {
    it('should initiate a relationship successfully', async () => {
      const initRequest = { remoteUrl: 'http://remote.com', userId: 'remote-user-id' };
      mockSharedUserService.initiateRemoteRelationship.mockResolvedValue({ id: 'rel-1' });

      const response = await request(app)
        .post('/shared-user/v1/shared-user/init')
        .send(initRequest);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ id: 'rel-1' });
      expect(mockSharedUserService.initiateRemoteRelationship).toHaveBeenCalledWith('test-user-id', initRequest);
    });
  });

  describe('POST /v1/shared-user/approve/:id', () => {
    it('should approve a relationship successfully', async () => {
      mockSharedUserService.approveSharingRequest.mockResolvedValue({ id: 'rel-1', status: 'ACTIVE' });

      const response = await request(app).post('/shared-user/v1/shared-user/approve/rel-1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ id: 'rel-1', status: 'ACTIVE' });
      expect(mockSharedUserService.approveSharingRequest).toHaveBeenCalledWith('test-user-id', 'rel-1');
    });
  });

  describe('POST /v1/shared-user/block/:id', () => {
    it('should block a relationship successfully', async () => {
      mockSharedUserService.blockRelationship.mockResolvedValue({ id: 'rel-1', status: 'BLOCKED' });

      const response = await request(app).post('/shared-user/v1/shared-user/block/rel-1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ id: 'rel-1', status: 'BLOCKED' });
      expect(mockSharedUserService.blockRelationship).toHaveBeenCalledWith('test-user-id', 'rel-1');
    });
  });

  describe('POST /v1/shared-user/request', () => {
    it('should proxy a request successfully', async () => {
        const proxyRequest = { requestToUserInfo: { id: 'remote-user' }, requestUrl: '/photos' };
        const proxyResponse = { data: 'some data' };
        mockSharedUserService.requestSharedUser.mockResolvedValue(proxyResponse);

        const response = await request(app)
            .post('/shared-user/v1/shared-user/request')
            .send(proxyRequest);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(proxyResponse);
        expect(mockSharedUserService.requestSharedUser).toHaveBeenCalledWith('test-user-id', proxyRequest);
    });
  });

  describe('POST /public/v1/shared-user/init', () => {
    it('should receive a remote relationship request', async () => {
        const remoteInitRequest = { requestFromUserInfo: { id: 'remote-user' }, requestToUserInfo: { id: 'local-user' }, timestamp: Date.now() };
        mockSharedUserService.receiveRemoteRelationshipRequest.mockResolvedValue({ id: 'rel-1' });

        const response = await request(app)
            .post('/shared-user/public/v1/shared-user/init')
            .send(remoteInitRequest);

        expect(response.status).toBe(201);
        expect(response.body).toEqual({ id: 'rel-1' });
        expect(mockSharedUserService.receiveRemoteRelationshipRequest).toHaveBeenCalledWith(remoteInitRequest);
    });
  });

  describe('POST /public/v1/shared-user/exchange', () => {
    it('should exchange public keys', async () => {
        const exchangeRequest = { requestFromUserInfo: { id: 'remote-user' }, requestToUserInfo: { id: 'local-user' }, timestamp: Date.now() };
        mockSharedUserService.exchangeRemotePublicKey.mockResolvedValue({ success: true });

        const response = await request(app)
            .post('/shared-user/public/v1/shared-user/exchange')
            .send(exchangeRequest);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ success: true });
        expect(mockSharedUserService.exchangeRemotePublicKey).toHaveBeenCalledWith(exchangeRequest);
    });
  });

  describe('POST /public/v1/shared-user/validate', () => {
    it('should validate a remote public key', async () => {
        const validateRequest = { requestFromUserInfo: { id: 'remote-user' }, requestToUserInfo: { id: 'local-user' }, timestamp: Date.now() };
        mockSharedUserService.validateRemotePublicKey.mockResolvedValue(undefined);

        const response = await request(app)
            .post('/shared-user/public/v1/shared-user/validate')
            .send(validateRequest);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Public key validated');
        expect(mockSharedUserService.validateRemotePublicKey).toHaveBeenCalledWith(validateRequest);
    });
  });

  describe('POST /public/v1/shared-user/session', () => {
    it('should get a session for a remote user', async () => {
        const sessionRequest = { requestFromUserInfo: { id: 'remote-user' }, requestToUserInfo: { id: 'local-user' }, timestamp: Date.now() };
        const sessionResponse = { token: 'some-token' };
        mockSharedUserService.getSession.mockResolvedValue(sessionResponse);

        const response = await request(app)
            .post('/shared-user/public/v1/shared-user/session')
            .send(sessionRequest);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(sessionResponse);
        expect(mockSharedUserService.getSession).toHaveBeenCalledWith(sessionRequest);
    });
  });
});
