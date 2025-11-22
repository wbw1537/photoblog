import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'path';
import * as crypto from 'crypto';
vi.mock('crypto');

import { PhotoFileService } from './photo-file.service.js';
import { PhotoFileRepository } from '../repositories/photo-file.repository.js';
import { PhotoBlogError } from '../errors/photoblog.error.js';
import { FileResolution } from '../models/photo-file.model.js';
import { UserType } from '@prisma/client';

vi.mock('../repositories/photo-file.repository.js');


describe('PhotoFileService', () => {
  let photoFileService: PhotoFileService;
  let mockPhotoFileRepository: any;

  const user = {
    id: 'user-1',
    type: UserType.LOCAL,
    localUser: {
      id: 'local-1',
      userId: 'user-1',
      basePath: '/users/photos',
      cachePath: '/users/cache',
      password: 'hashedpassword',
      publicKey: 'public',
      privateKey: 'private',
    },
  };

  const photoFile = {
    id: 'file-1',
    photoId: 'photo-1',
    filePath: '2025/photo.jpg',
    photo: {
      userId: 'user-1',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockPhotoFileRepository = {
      findById: vi.fn(),
    };
    photoFileService = new PhotoFileService(mockPhotoFileRepository);
  });

  describe('getPhotoFileImageById', () => {
    it('should return original photo path', async () => {
      mockPhotoFileRepository.findById.mockResolvedValue(photoFile);
      const expectedPath = path.join(user.localUser.basePath, photoFile.filePath);

      const result = await photoFileService.getPhotoFileImageById(user as any, 'file-1', FileResolution.ORIGINAL);

      expect(result).toBe(expectedPath);
    });

    it('should return preview photo path', async () => {
      const hash = 'hashedfile';
      const mockUpdate = vi.fn().mockReturnThis();
      const mockDigest = vi.fn().mockReturnValue(hash);

      vi.mocked(crypto.createHash).mockImplementation(() => ({
        update: mockUpdate,
        digest: mockDigest,
      } as any));

      mockPhotoFileRepository.findById.mockResolvedValue(photoFile);
      const expectedPath = path.join(user.localUser.cachePath, 'previews', hash.substring(0, 2), `${hash}.webp`);

      const result = await photoFileService.getPhotoFileImageById(user as any, 'file-1', FileResolution.PREVIEW);

      expect(result).toBe(expectedPath);
      expect(vi.mocked(crypto.createHash)).toHaveBeenCalledWith('md5');
      expect(mockUpdate).toHaveBeenCalledWith(photoFile.filePath);
      expect(mockDigest).toHaveBeenCalledWith('hex');
    });

    it('should throw 404 if photo file not found', async () => {
      mockPhotoFileRepository.findById.mockResolvedValue(null);
      await expect(photoFileService.getPhotoFileImageById(user as any, 'file-1', FileResolution.ORIGINAL)).rejects.toThrow(new PhotoBlogError('Photo file not found', 404));
    });

    it('should throw 401 if user is not authorized', async () => {
      const unauthorizedUser = { ...user, id: 'user-2' };
      mockPhotoFileRepository.findById.mockResolvedValue(photoFile);
      await expect(photoFileService.getPhotoFileImageById(unauthorizedUser as any, 'file-1', FileResolution.ORIGINAL)).rejects.toThrow(new PhotoBlogError('Unauthorized', 401));
    });

    it('should throw 400 for unsupported resolution', async () => {
      mockPhotoFileRepository.findById.mockResolvedValue(photoFile);
      await expect(photoFileService.getPhotoFileImageById(user as any, 'file-1', 'unsupported' as FileResolution)).rejects.toThrow(new PhotoBlogError('Resolution not supported', 400));
    });

    it('should throw 500 if user base path is not configured', async () => {
        const userWithoutBasePath = { ...user, localUser: { ...user.localUser, basePath: null } };
        mockPhotoFileRepository.findById.mockResolvedValue(photoFile);
        await expect(photoFileService.getPhotoFileImageById(userWithoutBasePath as any, 'file-1', FileResolution.ORIGINAL)).rejects.toThrow(new PhotoBlogError('User base path is not configured.', 500));
    });

    it('should throw 500 if user cache path is not configured', async () => {
        const userWithoutCachePath = { ...user, localUser: { ...user.localUser, cachePath: null } };
        mockPhotoFileRepository.findById.mockResolvedValue(photoFile);
        await expect(photoFileService.getPhotoFileImageById(userWithoutCachePath as any, 'file-1', FileResolution.PREVIEW)).rejects.toThrow(new PhotoBlogError('User cache path is not configured.', 500));
    });
  });
});
