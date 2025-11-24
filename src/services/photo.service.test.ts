import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';

import { PhotoService } from './photo.service.js';
import { PhotoBlogError } from '../errors/photoblog.error.js';

vi.mock('../repositories/photo.repository.js');
vi.mock('../repositories/tag.repository.js');

describe('PhotoService', () => {
  let photoService: PhotoService;
  let mockPhotoRepository: any;
  let mockTagRepository: any;

  const userId = 'user-1';
  const photoId = 'photo-1';
  const mockPhoto = {
    id: photoId,
    userId: userId,
    title: 'Test Photo',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockPhotoRepository = {
      findAllByFilter: vi.fn(),
      findById: vi.fn(),
      likePhoto: vi.fn(),
      unlikePhoto: vi.fn(),
    };
    mockTagRepository = {
      findTagIds: vi.fn(),
    };
    photoService = new PhotoService(mockPhotoRepository, mockTagRepository);
  });

  describe('getPhotos', () => {
    it('should return a list of photos', async () => {
      mockPhotoRepository.findAllByFilter.mockResolvedValue([mockPhoto]);
      const photos = await photoService.getPhotos(userId, {});
      expect(photos).toEqual([mockPhoto]);
      expect(mockPhotoRepository.findAllByFilter).toHaveBeenCalled();
    });

    it('should filter photos by tags', async () => {
      mockTagRepository.findTagIds.mockResolvedValue(['tag-1']);
      await photoService.getPhotos(userId, { tags: ['nature'] });
      expect(mockTagRepository.findTagIds).toHaveBeenCalledWith(['nature']);
      const whereClause = mockPhotoRepository.findAllByFilter.mock.calls[0][2];
      expect(whereClause.tags).toBeDefined();
    });
  });

  describe('getPhotoById', () => {
    it('should return a photo if found and user is authorized', async () => {
      mockPhotoRepository.findById.mockResolvedValue(mockPhoto);
      const result = await photoService.getPhotoById(userId, photoId);
      expect(result.data).toEqual(mockPhoto);
    });

    it('should throw 404 if photo not found', async () => {
      mockPhotoRepository.findById.mockResolvedValue(null);
      await expect(photoService.getPhotoById(userId, photoId)).rejects.toThrow(new PhotoBlogError('Photo not found', 404));
    });

    it('should throw 403 if user is not authorized', async () => {
      const otherUserPhoto = { ...mockPhoto, userId: 'user-2' };
      mockPhotoRepository.findById.mockResolvedValue(otherUserPhoto);
      await expect(photoService.getPhotoById(userId, photoId)).rejects.toThrow(new PhotoBlogError('Unauthorized', 403));
    });
  });

  describe('likePhoto', () => {
    it('should like a photo successfully', async () => {
      mockPhotoRepository.likePhoto.mockResolvedValue({ ...mockPhoto, liked: true });
      const result = await photoService.likePhoto(userId, photoId);
      expect(result.liked).toBe(true);
      expect(mockPhotoRepository.likePhoto).toHaveBeenCalledWith(userId, photoId);
    });

    it('should throw 404 if photo to like is not found', async () => {
      const error = new Prisma.PrismaClientKnownRequestError('Not found', { code: 'P2025', clientVersion: 'test' });
      mockPhotoRepository.likePhoto.mockRejectedValue(error);
      await expect(photoService.likePhoto(userId, 'non-existent-photo')).rejects.toThrow(new PhotoBlogError('Photo not found', 404));
    });
  });

  describe('unlikePhoto', () => {
    it('should unlike a photo successfully', async () => {
      mockPhotoRepository.unlikePhoto.mockResolvedValue({ ...mockPhoto, liked: false });
      const result = await photoService.unlikePhoto(userId, photoId);
      expect(result.liked).toBe(false);
      expect(mockPhotoRepository.unlikePhoto).toHaveBeenCalledWith(userId, photoId);
    });

    it('should throw 404 if photo to unlike is not found', async () => {
      const error = new Prisma.PrismaClientKnownRequestError('Not found', { code: 'P2025', clientVersion: 'test' });
      mockPhotoRepository.unlikePhoto.mockRejectedValue(error);
      await expect(photoService.unlikePhoto(userId, 'non-existent-photo')).rejects.toThrow(new PhotoBlogError('Photo not found', 404));
    });
  });
});
