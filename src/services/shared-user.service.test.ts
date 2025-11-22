import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Logger } from 'log4js';
import crypto from 'crypto';

import { SharedUserService } from './shared-user.service.js';
import { UserRelationshipRepository } from '../repositories/user-relationship.repository.js';
import { UserRepository } from '../repositories/user.repository.js';
import { RemoteUserConnector } from '../connectors/remote-user.connector.js';
import { PhotoBlogError } from '../errors/photoblog.error.js';
import { generateFederatedAccessToken } from '../utils/jwt.util.js';
import { RelationshipStatus, RelationshipType, UserType } from '@prisma/client';

// Mock dependencies
vi.mock('log4js');
vi.mock('../repositories/user-relationship.repository.js');
vi.mock('../repositories/user.repository.js');
vi.mock('../connectors/remote-user.connector.js');
vi.mock('crypto');
vi.mock('../utils/jwt.util.js');

describe('SharedUserService', () => {
  let sharedUserService: SharedUserService;
  let mockLogger: any;
  let mockUserRelationshipRepository: any;
  let mockUserRepository: any;
  let mockRemoteUserConnector: any;

  const userId = 'local-user-id';
  const remoteUserId = 'remote-user-id';
  const mockLocalUser = {
    id: userId,
    name: 'Local User',
    email: 'local@example.com',
    type: UserType.Normal,
    instanceUrl: 'http://localhost:3000',
    localUser: {
      id: 'local-1',
      userId: userId,
      password: 'hashedpassword',
      basePath: '/local/base',
      cachePath: '/local/cache',
      publicKey: 'local-public-key',
      privateKey: 'local-private-key',
    },
  };
  const mockRemoteUser = {
    id: remoteUserId,
    name: 'Remote User',
    email: 'remote@example.com',
    type: UserType.REMOTE,
    instanceUrl: 'http://remote.com',
    remoteUser: {
      id: 'remote-1',
      userId: remoteUserId,
      publicKey: 'remote-public-key',
      privateKey: null, // Remote users don't have private keys stored locally
      tempSymmetricKey: 'temp-symmetric-key',
      accessToken: 'old-access-token',
      accessTokenExpireTime: new Date(Date.now() + 3600 * 1000), // 1 hour from now
      session: 'encrypted-session',
    },
  };

  const mockRelationship = {
    id: 'rel-1',
    fromUserId: userId,
    toUserId: remoteUserId,
    status: RelationshipStatus.Pending,
    type: RelationshipType.Share,
    comment: 'Test comment',
    fromUser: mockLocalUser,
    toUser: mockRemoteUser,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
    };
    mockUserRelationshipRepository = {
      findUserRelationships: vi.fn(),
      createRelationship: vi.fn(),
      findById: vi.fn(),
      updateRelationshipStatus: vi.fn(),
      findRelationship: vi.fn(),
    };
    mockUserRepository = {
      findLocalUserById: vi.fn(),
      findById: vi.fn(),
      upsertRemoteUser: vi.fn(),
      updateRemoteUser: vi.fn(),
    };
    mockRemoteUserConnector = {
      getRemoteUsers: vi.fn(),
      buildInitRemoteRequestBody: vi.fn(),
      sendRemoteSharingRequest: vi.fn(),
      buildExchangeKeyRequestBody: vi.fn(),
      exchangeEncryptedPublicKey: vi.fn(),
      buildValidateKeyRequestBody: vi.fn(),
      validateRemotePublicKey: vi.fn(),
      buildSessionRequestBody: vi.fn(),
      getSession: vi.fn(),
      proxyRequestToRemote: vi.fn(),
    };
    sharedUserService = new SharedUserService(
      mockLogger as unknown as Logger,
      mockUserRelationshipRepository,
      mockUserRepository,
      mockRemoteUserConnector
    );

    // Mock crypto functions
    vi.spyOn(crypto, 'generateKeyPairSync').mockReturnValue({
        publicKey: { export: vi.fn(() => Buffer.from('temp-public-key-pem')) },
        privateKey: { export: vi.fn(() => Buffer.from('temp-private-key-pem')) },
    } as any);
    vi.spyOn(crypto, 'createPrivateKey').mockReturnValue('privateKeyObject' as any);
    vi.spyOn(crypto, 'createPublicKey').mockReturnValue('publicKeyObject' as any);
    vi.spyOn(crypto, 'diffieHellman').mockReturnValue(Buffer.from('shared-secret'));
    vi.spyOn(crypto, 'createHash').mockReturnValue({
        update: vi.fn().mockReturnThis(),
        digest: vi.fn(() => 'hashed-shared-secret-base64'),
    } as any);
    vi.spyOn(crypto, 'randomBytes').mockReturnValue(Buffer.from('1234567890abcdef1234567890abcdef', 'hex')); // 16 bytes
    vi.spyOn(crypto, 'createCipheriv').mockReturnValue({
        update: vi.fn(() => 'encrypted-part1'),
        final: vi.fn(() => 'encrypted-part2'),
    } as any);
    vi.spyOn(crypto, 'createDecipheriv').mockReturnValue({
        update: vi.fn(() => 'decrypted-part1'),
        final: vi.fn(() => 'decrypted-part2'),
    } as any);
    vi.spyOn(crypto, 'createSign').mockReturnValue({
      update: vi.fn().mockReturnThis(),
      sign: vi.fn(() => 'test-signature'),
    } as any);
    vi.spyOn(crypto, 'createVerify').mockReturnValue({
      update: vi.fn().mockReturnThis(),
      verify: vi.fn(() => true),
    } as any);
    vi.spyOn(crypto, 'publicEncrypt').mockReturnValue(Buffer.from('encrypted-session').toString('base64'));
    vi.spyOn(crypto, 'privateDecrypt').mockReturnValue(Buffer.from('decrypted-session'));

    // Mock jwt.util
    vi.mocked(generateFederatedAccessToken).mockReturnValue({ token: 'federated-access-token', expiresAt: new Date(Date.now() + 3600 * 1000).toISOString() });
  });

  describe('getSharedUsers', () => {
    it('should return a list of shared users', async () => {
      mockUserRelationshipRepository.findUserRelationships.mockResolvedValue({
        data: [{
          ...mockRelationship,
          fromUser: { id: userId, name: 'Local User', email: 'local@example.com', instanceUrl: 'http://localhost:3000' },
          toUser: { id: remoteUserId, name: 'Remote User', email: 'remote@example.com', instanceUrl: 'http://remote.com' },
        }],
        pagination: { total: 1, skip: 0, take: 10 },
      });

      const result = await sharedUserService.getSharedUsers(userId, {});
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Remote User');
      expect(result.data[0].direction).toBe('Outgoing');
    });

    it('should filter by direction "Incoming"', async () => {
      mockUserRelationshipRepository.findUserRelationships.mockResolvedValue({
        data: [{
          ...mockRelationship,
          fromUserId: remoteUserId,
          toUserId: userId,
          fromUser: { id: remoteUserId, name: 'Remote User', email: 'remote@example.com', instanceUrl: 'http://remote.com' },
          toUser: { id: userId, name: 'Local User', email: 'local@example.com', instanceUrl: 'http://localhost:3000' },
        }],
        pagination: { total: 1, skip: 0, take: 10 },
      });

      const result = await sharedUserService.getSharedUsers(userId, { direction: 'Incoming' });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Remote User');
      expect(result.data[0].direction).toBe('Incoming');
    });
  });

  describe('fetchRemoteUsers', () => {
    it('should fetch remote users from the connector', async () => {
      const publicUser = { id: 'remote-public-id', name: 'Remote Public', email: 'remote-public@example.com' };
      mockRemoteUserConnector.getRemoteUsers.mockResolvedValue(publicUser);
      const result = await sharedUserService.fetchRemoteUsers('http://remote.com');
      expect(result).toEqual(publicUser);
      expect(mockRemoteUserConnector.getRemoteUsers).toHaveBeenCalledWith('http://remote.com');
    });
  });

  describe('initiateRemoteRelationship', () => {
    it('should initiate a remote relationship', async () => {
      mockUserRepository.findLocalUserById.mockResolvedValue(mockLocalUser);
      mockRemoteUserConnector.buildInitRemoteRequestBody.mockReturnValue({});
      mockRemoteUserConnector.sendRemoteSharingRequest.mockResolvedValue({
        requestFromUserInfo: { id: 'some-id' },
        requestToUserInfo: { id: 'some-other-id', email: mockRemoteUser.email, name: mockRemoteUser.name, remoteAddress: mockRemoteUser.instanceUrl },
        tempPublicKey: 'remote-temp-public-key',
      });
      mockUserRepository.upsertRemoteUser.mockResolvedValue(mockRemoteUser);
      mockUserRelationshipRepository.createRelationship.mockResolvedValue(mockRelationship);

      const requestDto = {
        requestToUserInfo: { address: 'http://remote.com', id: 'remote-id', name: 'Remote User', email: 'remote@example.com' },
        comment: 'Initial request',
      };
      const result = await sharedUserService.initiateRemoteRelationship(userId, requestDto);

      expect(result.name).toBe(mockRemoteUser.name);
      expect(result.direction).toBe('Outgoing');
      expect(mockUserRepository.upsertRemoteUser).toHaveBeenCalledWith(
        mockRemoteUser.email,
        mockRemoteUser.name,
        mockRemoteUser.instanceUrl,
        { tempSymmetricKey: 'hashed-shared-secret-base64' }
      );
      expect(mockUserRelationshipRepository.createRelationship).toHaveBeenCalledWith(
        userId,
        remoteUserId,
        RelationshipType.Share,
        'Initial request'
      );
    });

    it('should throw PhotoBlogError if local user not found', async () => {
      mockUserRepository.findLocalUserById.mockResolvedValue(null);
      const requestDto = {
        requestToUserInfo: { address: 'http://remote.com', id: 'remote-id', name: 'Remote User', email: 'remote@example.com' },
        comment: 'Initial request',
      };
      await expect(sharedUserService.initiateRemoteRelationship(userId, requestDto)).rejects.toThrow(new PhotoBlogError('Local user not found or data incomplete', 404));
    });
  });

  describe('receiveRemoteRelationshipRequest', () => {
    it('should successfully receive a remote relationship request', async () => {
      mockUserRepository.findLocalUserById.mockResolvedValue(mockLocalUser);
      mockUserRepository.upsertRemoteUser.mockResolvedValue(mockRemoteUser);
      mockUserRelationshipRepository.createRelationship.mockResolvedValue({
        ...mockRelationship,
        fromUserId: remoteUserId,
        toUserId: userId,
      });

      const sharedUserRequest = {
        requestFromUserInfo: { id: 'remote-id', name: 'Remote User', email: 'remote@example.com', remoteAddress: 'http://remote.com' },
        requestToUserInfo: { id: userId },
        tempPublicKey: 'sender-temp-public-key',
        timestamp: new Date().toISOString(),
      };
      const result = await sharedUserService.receiveRemoteRelationshipRequest(sharedUserRequest);

      expect(result.requestToUserInfo.id).toBe(userId);
      expect(result.tempPublicKey).toBe('temp-public-key-pem');
      expect(mockUserRepository.upsertRemoteUser).toHaveBeenCalledWith(
        sharedUserRequest.requestFromUserInfo.email,
        sharedUserRequest.requestFromUserInfo.name,
        sharedUserRequest.requestFromUserInfo.remoteAddress,
        { tempSymmetricKey: 'hashed-shared-secret-base64' }
      );
      expect(mockUserRelationshipRepository.createRelationship).toHaveBeenCalledWith(
        remoteUserId,
        userId,
        RelationshipType.Share,
        sharedUserRequest.comment
      );
    });

    it('should throw PhotoBlogError if local user not found', async () => {
      mockUserRepository.findLocalUserById.mockResolvedValue(null);
      const sharedUserRequest = {
        requestFromUserInfo: { id: 'remote-id', name: 'Remote User', email: 'remote@example.com', remoteAddress: 'http://remote.com' },
        requestToUserInfo: { id: userId },
        tempPublicKey: 'sender-temp-public-key',
        timestamp: new Date().toISOString(),
      };
      await expect(sharedUserService.receiveRemoteRelationshipRequest(sharedUserRequest)).rejects.toThrow(new PhotoBlogError('Local user not found', 404));
    });
  });

  describe('approveSharingRequest', () => {
    it('should approve an incoming sharing request for local user', async () => {
      const incomingRelationship = {
        id: 'rel-1',
        fromUserId: remoteUserId,
        toUserId: userId,
        status: RelationshipStatus.Pending,
        type: RelationshipType.Share,
        comment: 'Test comment',
              fromUser: { // Explicitly define fromUser based on mockRemoteUser
                id: mockRemoteUser.id,
                name: mockRemoteUser.name,
                email: mockRemoteUser.email,
                type: 'Remote', // Use string literal instead of enum
                instanceUrl: mockRemoteUser.instanceUrl,
                remoteUser: mockRemoteUser.remoteUser,
              },
              toUser: { // Explicitly define toUser based on mockLocalUser
                id: mockLocalUser.id,
                name: mockLocalUser.name,
                email: mockLocalUser.email,
                type: 'Normal', // Use string literal instead of enum
                instanceUrl: mockLocalUser.instanceUrl,
                localUser: mockLocalUser.localUser,
              },      };
      mockUserRelationshipRepository.findById.mockResolvedValue(incomingRelationship);

      mockUserRepository.findLocalUserById.mockResolvedValue(mockLocalUser);
      mockUserRelationshipRepository.updateRelationshipStatus.mockResolvedValue({
        ...incomingRelationship,
        status: RelationshipStatus.Active,
      });

      // Mock exchangeKeys and validateKeys internal calls
    vi.spyOn(SharedUserService.prototype as any, 'exchangeKeys').mockResolvedValue(undefined);
    vi.spyOn(SharedUserService.prototype as any, 'validateKeys').mockResolvedValue(undefined);


      const result = await sharedUserService.approveSharingRequest(userId, 'rel-1');
      expect(result.status).toBe(RelationshipStatus.Active);
      expect(result.direction).toBe('Incoming');
      expect(mockUserRelationshipRepository.updateRelationshipStatus).toHaveBeenCalledWith('rel-1', RelationshipStatus.Active);
      expect(sharedUserService['exchangeKeys']).toHaveBeenCalled();
      expect(sharedUserService['validateKeys']).toHaveBeenCalled();
    });

    it('should throw 404 if relationship not found or user mismatch', async () => {
      mockUserRelationshipRepository.findById.mockResolvedValue(null);
      await expect(sharedUserService.approveSharingRequest(userId, 'rel-1')).rejects.toThrow(new PhotoBlogError('Incoming relationship not found or user mismatch', 404));
    });

    it('should throw 400 if relationship is already active', async () => {
      const activeRelationship = { ...mockRelationship, status: RelationshipStatus.Active, fromUserId: remoteUserId, toUserId: userId };
      mockUserRelationshipRepository.findById.mockResolvedValue(activeRelationship);
      await expect(sharedUserService.approveSharingRequest(userId, 'rel-1')).rejects.toThrow(new PhotoBlogError('Relationship is already active', 400));
    });
  });

  describe('blockRelationship', () => {
    it('should block an existing relationship', async () => {
      mockUserRelationshipRepository.findById.mockResolvedValue(mockRelationship);
      mockUserRelationshipRepository.updateRelationshipStatus.mockResolvedValue({
        ...mockRelationship,
        status: RelationshipStatus.Blocked,
        toUser: mockRemoteUser, // Ensure toUser is populated for return DTO
      });

      const result = await sharedUserService.blockRelationship(userId, 'rel-1');
      expect(result.status).toBe(RelationshipStatus.Blocked);
      expect(mockUserRelationshipRepository.updateRelationshipStatus).toHaveBeenCalledWith('rel-1', RelationshipStatus.Blocked);
    });

    it('should throw 404 if relationship not found for this user', async () => {
      mockUserRelationshipRepository.findById.mockResolvedValue(null);
      await expect(sharedUserService.blockRelationship(userId, 'rel-1')).rejects.toThrow(new PhotoBlogError('Relationship not found for this user', 404));
    });

    it('should throw 400 if relationship is already blocked', async () => {
      const blockedRelationship = { ...mockRelationship, status: RelationshipStatus.Blocked };
      mockUserRelationshipRepository.findById.mockResolvedValue(blockedRelationship);
      await expect(sharedUserService.blockRelationship(userId, 'rel-1')).rejects.toThrow(new PhotoBlogError('Relationship is already blocked', 400));
    });
  });

  describe('exchangeRemotePublicKey', () => {
    it('should exchange remote public key', async () => {
      mockUserRelationshipRepository.findRelationship.mockResolvedValue({
        ...mockRelationship,
        fromUserId: remoteUserId,
        toUserId: userId,
        fromUser: mockRemoteUser,
        toUser: mockLocalUser,
      });
      mockUserRepository.updateRemoteUser.mockResolvedValue(mockRemoteUser);

      const request = {
        requestFromUserInfo: { id: remoteUserId },
        requestToUserInfo: { id: userId },
        encryptedPublicKey: 'iv-plus-encrypted-key',
        timestamp: new Date().toISOString(),
      };
      const result = await sharedUserService.exchangeRemotePublicKey(request);

      expect(result.encryptedPublicKey).toBe('1234567890abcdef1234567890abcdefencrypted-part1encrypted-part2'); // iv + encrypted key
      expect(result.signature).toBe('test-signature');
      expect(mockUserRepository.updateRemoteUser).toHaveBeenCalledWith(remoteUserId, { publicKey: 'decrypted-part1decrypted-part2' });
    });

    it('should throw error if temp symmetric key not found', async () => {
      const remoteUserWithoutTempKey = { ...mockRemoteUser, remoteUser: { ...mockRemoteUser.remoteUser, tempSymmetricKey: null } };
      mockUserRelationshipRepository.findRelationship.mockResolvedValue({
        ...mockRelationship,
        fromUserId: remoteUserId,
        toUserId: userId,
        fromUser: remoteUserWithoutTempKey,
        toUser: mockLocalUser,
      });

      const request = {
        requestFromUserInfo: { id: remoteUserId },
        requestToUserInfo: { id: userId },
        encryptedPublicKey: 'iv-plus-encrypted-key',
        timestamp: new Date().toISOString(),
      };
      await expect(sharedUserService.exchangeRemotePublicKey(request)).rejects.toThrow(new PhotoBlogError('Temporary symmetric key not found for remote user', 500));
    });
  });

  describe('validateRemotePublicKey', () => {
    it('should validate remote public key and activate relationship', async () => {
      mockUserRelationshipRepository.findRelationship.mockResolvedValue({
        ...mockRelationship,
        fromUserId: remoteUserId,
        toUserId: userId,
        fromUser: mockRemoteUser,
        toUser: mockLocalUser,
      });
      mockUserRelationshipRepository.updateRelationshipStatus.mockResolvedValue({ ...mockRelationship, status: RelationshipStatus.Active });

      const request = {
        requestFromUserInfo: { id: remoteUserId },
        requestToUserInfo: { id: userId },
        signature: 'valid-signature',
        timestamp: new Date().toISOString(),
      };
      await sharedUserService.validateRemotePublicKey(request);
      expect(mockUserRelationshipRepository.updateRelationshipStatus).toHaveBeenCalledWith(mockRelationship.id, RelationshipStatus.Active);
    });

    it('should throw error if remote user public key not found', async () => {
      const remoteUserWithoutPublicKey = { ...mockRemoteUser, remoteUser: { ...mockRemoteUser.remoteUser, publicKey: null } };
      mockUserRelationshipRepository.findRelationship.mockResolvedValue({
        ...mockRelationship,
        fromUserId: remoteUserId,
        toUserId: userId,
        fromUser: remoteUserWithoutPublicKey,
        toUser: mockLocalUser,
      });

      const request = {
        requestFromUserInfo: { id: remoteUserId },
        requestToUserInfo: { id: userId },
        signature: 'valid-signature',
        timestamp: new Date().toISOString(),
      };
      await expect(sharedUserService.validateRemotePublicKey(request)).rejects.toThrow(new PhotoBlogError('Remote user public key not found', 500));
    });

    it('should throw error if signature is invalid', async () => {
      vi.spyOn(crypto, 'createVerify').mockReturnValue({
        update: vi.fn().mockReturnThis(),
        verify: vi.fn(() => false),
      } as any);

      mockUserRelationshipRepository.findRelationship.mockResolvedValue({
        ...mockRelationship,
        fromUserId: remoteUserId,
        toUserId: userId,
        fromUser: mockRemoteUser,
        toUser: mockLocalUser,
      });

      const request = {
        requestFromUserInfo: { id: remoteUserId },
        requestToUserInfo: { id: userId },
        signature: 'invalid-signature',
        timestamp: new Date().toISOString(),
      };
      await expect(sharedUserService.validateRemotePublicKey(request)).rejects.toThrow(new PhotoBlogError('Validate remote user\'s signature failed', 500));
    });
  });

  describe('getSession', () => {
    it('should return an access token and encrypted session', async () => {
      mockUserRepository.findLocalUserById.mockResolvedValue(mockLocalUser);
      mockUserRepository.findById.mockResolvedValue(mockRemoteUser);
      mockUserRelationshipRepository.findRelationship.mockResolvedValue({ ...mockRelationship, status: RelationshipStatus.Active });

      const sessionRequest = {
        requestFromUserInfo: { id: remoteUserId },
        requestToUserInfo: { id: userId },
        signature: 'valid-signature',
        timestamp: new Date().toISOString(),
      };
      const result = await sharedUserService.getSession(sessionRequest);

      expect(result.accessToken.token).toBe('federated-access-token');
      expect(result.session).toBe(Buffer.from('encrypted-session').toString('base64'));
    });

    it('should throw error if user not found or remote user data is missing', async () => {
      mockUserRepository.findLocalUserById.mockResolvedValue(null);
      const sessionRequest = {
        requestFromUserInfo: { id: remoteUserId },
        requestToUserInfo: { id: userId },
        signature: 'valid-signature',
        timestamp: new Date().toISOString(),
      };
      await expect(sharedUserService.getSession(sessionRequest)).rejects.toThrow(new PhotoBlogError('User not found or remote user data is missing', 404));
    });

    it('should throw error if active relationship not found', async () => {
      mockUserRepository.findLocalUserById.mockResolvedValue(mockLocalUser);
      mockUserRepository.findById.mockResolvedValue(mockRemoteUser);
      mockUserRelationshipRepository.findRelationship.mockResolvedValue({ ...mockRelationship, status: RelationshipStatus.Pending });

      const sessionRequest = {
        requestFromUserInfo: { id: remoteUserId },
        requestToUserInfo: { id: userId },
        signature: 'valid-signature',
        timestamp: new Date().toISOString(),
      };
      await expect(sharedUserService.getSession(sessionRequest)).rejects.toThrow(new PhotoBlogError('Active relationship not found', 403));
    });

    it('should throw error if remote user public key is missing', async () => {
      mockUserRepository.findLocalUserById.mockResolvedValue(mockLocalUser);
      const remoteUserWithoutPublicKey = { ...mockRemoteUser, remoteUser: { ...mockRemoteUser.remoteUser, publicKey: null } };
      mockUserRepository.findById.mockResolvedValue(remoteUserWithoutPublicKey);
      mockUserRelationshipRepository.findRelationship.mockResolvedValue({ ...mockRelationship, status: RelationshipStatus.Active });

      const sessionRequest = {
        requestFromUserInfo: { id: remoteUserId },
        requestToUserInfo: { id: userId },
        signature: 'valid-signature',
        timestamp: new Date().toISOString(),
      };
      await expect(sharedUserService.getSession(sessionRequest)).rejects.toThrow(new PhotoBlogError('Remote user public key is missing. Cannot establish session.', 500));
    });
  });

  describe('requestSharedUser', () => {
    it('should successfully proxy request to remote user', async () => {
      mockUserRepository.findLocalUserById.mockResolvedValue(mockLocalUser);
      mockUserRelationshipRepository.findRelationship.mockResolvedValue({
        ...mockRelationship,
        fromUserId: userId,
        toUserId: remoteUserId,
        status: RelationshipStatus.Active,
        toUser: mockRemoteUser,
      });
      // Mock updateTokenValidity to return valid token
      vi.spyOn(sharedUserService as any, 'updateTokenValidity').mockResolvedValue({
        accessToken: 'valid-access-token',
        session: 'valid-session',
      });

      mockRemoteUserConnector.proxyRequestToRemote.mockResolvedValue('remote-response');

      const sharedUserContextRequest = {
        requestToUserInfo: { id: remoteUserId },
        requestHeaders: { 'Custom-Header': 'value' },
        requestMethod: 'GET',
        requestUrl: '/api/data',
      };
      const result = await sharedUserService.requestSharedUser(userId, sharedUserContextRequest as any);

      expect(result).toBe('remote-response');
      expect(mockRemoteUserConnector.proxyRequestToRemote).toHaveBeenCalledWith(
        mockRemoteUser.instanceUrl,
        expect.objectContaining({
          requestHeaders: expect.objectContaining({
            'Authorization': 'Bearer valid-access-token',
            'Custom-Header': 'value',
          }),
        })
      );
    });

    it('should refresh token if expired', async () => {
      mockUserRepository.findLocalUserById.mockResolvedValue(mockLocalUser);
      const remoteUserWithExpiredToken = { ...mockRemoteUser, remoteUser: { ...mockRemoteUser.remoteUser, accessTokenExpireTime: new Date(Date.now() - 3600 * 1000) } }; // 1 hour ago
      mockUserRelationshipRepository.findRelationship.mockResolvedValue({
        ...mockRelationship,
        fromUserId: userId,
        toUserId: remoteUserId,
        status: RelationshipStatus.Active,
        toUser: remoteUserWithExpiredToken,
      });

      mockRemoteUserConnector.buildSessionRequestBody.mockReturnValue({});
      mockRemoteUserConnector.getSession.mockResolvedValue({
        accessToken: { token: 'new-federated-token', expiresAt: new Date(Date.now() + 3600 * 1000).toISOString() },
        session: 'new-encrypted-session',
      });
      mockUserRepository.updateRemoteUser.mockResolvedValue(remoteUserWithExpiredToken); // return the updated user

      // Mock private decrypt function.
      vi.spyOn(crypto, 'privateDecrypt').mockReturnValue(Buffer.from('decrypted-new-session'));

      mockRemoteUserConnector.proxyRequestToRemote.mockResolvedValue('remote-response');

      const sharedUserContextRequest = {
        requestToUserInfo: { id: remoteUserId },
        requestHeaders: {},
        requestMethod: 'GET',
        requestUrl: '/api/data',
      };
      await sharedUserService.requestSharedUser(userId, sharedUserContextRequest as any);

      expect(mockRemoteUserConnector.getSession).toHaveBeenCalled();
      expect(mockUserRepository.updateRemoteUser).toHaveBeenCalledWith(
        remoteUserId,
        expect.objectContaining({ accessToken: 'new-federated-token', session: 'decrypted-new-session' })
      );
      expect(mockRemoteUserConnector.proxyRequestToRemote).toHaveBeenCalledWith(
        remoteUserWithExpiredToken.instanceUrl,
        expect.objectContaining({
          requestHeaders: expect.objectContaining({
            'Authorization': 'Bearer new-federated-token',
          }),
        })
      );
    });

    it('should throw error if active relationship with remote user not found', async () => {
      mockUserRepository.findLocalUserById.mockResolvedValue(mockLocalUser);
      mockUserRelationshipRepository.findRelationship.mockResolvedValue(null);

      const sharedUserContextRequest = {
        requestToUserInfo: { id: remoteUserId },
        requestHeaders: {},
        requestMethod: 'GET',
        requestUrl: '/api/data',
      };
      await expect(sharedUserService.requestSharedUser(userId, sharedUserContextRequest as any)).rejects.toThrow(new PhotoBlogError('Active relationship with remote user not found', 403));
    });
  });
});
