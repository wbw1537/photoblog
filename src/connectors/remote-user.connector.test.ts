import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RemoteUserConnector } from './remote-user.connector.js';
import { PhotoBlogError } from '../errors/photoblog.error.js';
import { Logger } from 'log4js';
import { User } from '@prisma/client';

// Mock fetch globally
global.fetch = vi.fn();

describe('RemoteUserConnector', () => {
  let remoteUserConnector: RemoteUserConnector;
  let mockLogger: Logger;

  const remoteInstanceUrl = 'example.com:3000';
  const mockUser: User = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    instanceUrl: 'localhost:3000',
    password: 'hashed-password',
    publicKey: 'public-key',
    privateKey: 'private-key',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLogger = {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
    } as any;
    remoteUserConnector = new RemoteUserConnector(mockLogger);
  });

  describe('getRemoteUsers', () => {
    it('should successfully fetch remote users', async () => {
      const mockResponse = { users: [{ id: 'user-1', name: 'Remote User' }] };
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await remoteUserConnector.getRemoteUsers(remoteInstanceUrl);

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        `http://${remoteInstanceUrl}/api/public/v1/users`,
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should throw error when fetch fails', async () => {
      (fetch as any).mockResolvedValue({
        ok: false,
        statusText: 'Not Found',
      });

      await expect(
        remoteUserConnector.getRemoteUsers(remoteInstanceUrl)
      ).rejects.toThrow(new PhotoBlogError('Failed to fetch remote users: Not Found', 500));

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('sendRemoteSharingRequest', () => {
    it('should successfully send remote sharing request', async () => {
      const requestBody = {
        requestFromUserInfo: { id: 'user-1', name: 'Test', email: 'test@example.com', remoteAddress: 'localhost' },
        requestToUserInfo: { id: 'user-2' },
        tempPublicKey: 'temp-key',
        timestamp: Date.now(),
        comment: '',
      };
      const mockResponse = { success: true };
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await remoteUserConnector.sendRemoteSharingRequest(
        remoteInstanceUrl,
        requestBody
      );

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        `http://${remoteInstanceUrl}/api/public/v1/shared-user/init`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestBody),
        })
      );
    });

    it('should throw error when request fails', async () => {
      (fetch as any).mockResolvedValue({
        ok: false,
        statusText: 'Bad Request',
      });

      await expect(
        remoteUserConnector.sendRemoteSharingRequest(remoteInstanceUrl, {} as any)
      ).rejects.toThrow(new PhotoBlogError('Failed to send remote sharing request: Bad Request', 500));
    });
  });

  describe('exchangeEncryptedPublicKey', () => {
    it('should successfully exchange encrypted public key', async () => {
      const requestBody = {
        requestToUserInfo: { id: 'user-2' },
        requestFromUserInfo: { id: 'user-1' },
        encryptedPublicKey: 'encrypted-key',
        timestamp: Date.now(),
      };
      const mockResponse = { encryptedPublicKey: 'response-encrypted-key' };
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await remoteUserConnector.exchangeEncryptedPublicKey(
        remoteInstanceUrl,
        requestBody
      );

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        `http://${remoteInstanceUrl}/api/public/v1/shared-user/exchange`,
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should throw error when response is invalid', async () => {
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      await expect(
        remoteUserConnector.exchangeEncryptedPublicKey(remoteInstanceUrl, {} as any)
      ).rejects.toThrow(new PhotoBlogError('Invalid response from remote user', 500));
    });

    it('should throw error when exchange fails', async () => {
      (fetch as any).mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error',
      });

      await expect(
        remoteUserConnector.exchangeEncryptedPublicKey(remoteInstanceUrl, {} as any)
      ).rejects.toThrow(new PhotoBlogError('Failed to exchange encrypted public key: Internal Server Error', 500));
    });
  });

  describe('validateRemotePublicKey', () => {
    it('should successfully validate remote public key', async () => {
      const requestBody = {
        requestFromUserInfo: { id: 'user-1' },
        requestToUserInfo: { id: 'user-2' },
        signature: 'signature',
        timestamp: Date.now(),
      };
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ valid: true }),
      });

      const result = await remoteUserConnector.validateRemotePublicKey(
        remoteInstanceUrl,
        requestBody
      );

      expect(result).toBe(true);
    });

    it('should throw error when validation fails', async () => {
      (fetch as any).mockResolvedValue({
        ok: false,
        statusText: 'Unauthorized',
      });

      await expect(
        remoteUserConnector.validateRemotePublicKey(remoteInstanceUrl, {} as any)
      ).rejects.toThrow(new PhotoBlogError('Failed to validate remote public key: Unauthorized', 500));
    });
  });

  describe('getSession', () => {
    it('should successfully get session', async () => {
      const requestBody = {
        requestFromUserInfo: { id: 'user-1' },
        requestToUserInfo: { id: 'user-2' },
        signature: 'signature',
        timestamp: Date.now(),
      };
      const mockResponse = { sessionToken: 'token', expiresAt: Date.now() };
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await remoteUserConnector.getSession(
        remoteInstanceUrl,
        requestBody
      );

      expect(result).toEqual(mockResponse);
    });

    it('should throw error when getting session fails', async () => {
      (fetch as any).mockResolvedValue({
        ok: false,
        statusText: 'Forbidden',
      });

      await expect(
        remoteUserConnector.getSession(remoteInstanceUrl, {} as any)
      ).rejects.toThrow(new PhotoBlogError('Failed to get session: Forbidden', 500));
    });
  });

  describe('proxyRequestToRemote', () => {
    it('should successfully proxy request to remote', async () => {
      const contextRequest = {
        requestUrl: '/v1/blogs',
        requestMethod: 'GET',
        requestHeaders: { 'Content-Type': 'application/json' },
        requestBody: {},
      };
      const mockResponse = { data: 'response data' };
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await remoteUserConnector.proxyRequestToRemote(
        remoteInstanceUrl,
        contextRequest
      );

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        `http://${remoteInstanceUrl}/api/private${contextRequest.requestUrl}`,
        expect.objectContaining({
          method: contextRequest.requestMethod,
          headers: contextRequest.requestHeaders,
        })
      );
    });

    it('should return raw response for preview/view requests', async () => {
      const contextRequest = {
        requestUrl: '/v1/photos/preview/123',
        requestMethod: 'GET',
        requestHeaders: {},
        requestBody: {},
      };
      const mockResponse = { ok: true };
      (fetch as any).mockResolvedValue(mockResponse);

      const result = await remoteUserConnector.proxyRequestToRemote(
        remoteInstanceUrl,
        contextRequest
      );

      expect(result).toBe(mockResponse);
    });

    it('should throw error when proxy request fails', async () => {
      (fetch as any).mockResolvedValue({
        ok: false,
        statusText: 'Service Unavailable',
      });

      await expect(
        remoteUserConnector.proxyRequestToRemote(remoteInstanceUrl, {
          requestUrl: '/test',
          requestMethod: 'GET',
          requestHeaders: {},
          requestBody: {},
        })
      ).rejects.toThrow(new PhotoBlogError('Failed to proxy request to remote: Service Unavailable', 500));
    });
  });

  describe('buildInitRemoteRequestBody', () => {
    it('should build init remote request body correctly', () => {
      const remoteUserInfo = { id: 'remote-user-1', address: 'remote.com' };
      const tempPublicKey = 'temp-key';

      const result = remoteUserConnector.buildInitRemoteRequestBody(
        mockUser,
        remoteUserInfo,
        tempPublicKey
      );

      expect(result).toEqual({
        requestFromUserInfo: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          remoteAddress: mockUser.instanceUrl,
        },
        requestToUserInfo: {
          id: remoteUserInfo.id,
        },
        tempPublicKey,
        timestamp: expect.any(Number),
        comment: '',
      });
    });
  });

  describe('buildExchangeKeyRequestBody', () => {
    it('should build exchange key request body correctly', () => {
      const remoteUser = { ...mockUser, id: 'remote-user-1' };
      const encryptedUserPublicKey = 'encrypted-key';

      const result = remoteUserConnector.buildExchangeKeyRequestBody(
        mockUser,
        remoteUser,
        encryptedUserPublicKey
      );

      expect(result).toEqual({
        requestToUserInfo: {
          id: remoteUser.id,
        },
        requestFromUserInfo: {
          id: mockUser.id,
        },
        encryptedPublicKey: encryptedUserPublicKey,
        timestamp: expect.any(Number),
      });
    });
  });

  describe('buildValidateKeyRequestBody', () => {
    it('should build validate key request body correctly', () => {
      const remoteUser = { ...mockUser, id: 'remote-user-1' };
      const signature = 'signature-value';

      const result = remoteUserConnector.buildValidateKeyRequestBody(
        mockUser,
        remoteUser,
        signature
      );

      expect(result).toEqual({
        requestFromUserInfo: {
          id: mockUser.id,
        },
        requestToUserInfo: {
          id: remoteUser.id,
        },
        signature,
        timestamp: expect.any(Number),
      });
    });
  });

  describe('buildSessionRequestBody', () => {
    it('should build session request body correctly', () => {
      const remoteUserId = 'remote-user-1';
      const signature = 'signature-value';

      const result = remoteUserConnector.buildSessionRequestBody(
        mockUser,
        remoteUserId,
        signature
      );

      expect(result).toEqual({
        requestFromUserInfo: {
          id: mockUser.id,
        },
        requestToUserInfo: {
          id: remoteUserId,
        },
        signature,
        timestamp: expect.any(Number),
      });
    });
  });
});
