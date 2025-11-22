
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';
import { createPhotoRouter } from './photo.router.js';
import { PhotoBlogError } from '../errors/photoblog.error.js';

vi.mock('../services/photo.service.js');

describe('Photo Router', () => {
  let app: Express;
  let mockPhotoService: any;
  let mockAuthenticate: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPhotoService = {
      getPhotos: vi.fn(),
      getPhotoById: vi.fn(),
      likePhoto: vi.fn(),
      unlikePhoto: vi.fn(),
    };

    mockAuthenticate = vi.fn((req, res, next) => {
      req.body.user = { id: 'test-user-id' };
      next();
    });

    app = express();
    app.use(express.json());
    app.use('/photos', createPhotoRouter(mockPhotoService, mockAuthenticate));

    app.use((err: any, req: any, res: any, next: any) => {
      if (err instanceof PhotoBlogError) {
        res.status(err.statusCode).json({ error: err.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  });

  describe('GET /v1/photos', () => {
    it('should get photos successfully', async () => {
      const photos = [{ id: '1', title: 'Test Photo' }];
      mockPhotoService.getPhotos.mockResolvedValue(photos);

      const response = await request(app).get('/photos/v1/photos');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(photos);
      expect(mockPhotoService.getPhotos).toHaveBeenCalledWith('test-user-id', expect.any(Object));
    });
  });

  describe('GET /v1/photos/:id', () => {
    it('should get a photo by id successfully', async () => {
      const photo = { id: '1', title: 'Test Photo' };
      mockPhotoService.getPhotoById.mockResolvedValue(photo);

      const response = await request(app).get('/photos/v1/photos/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(photo);
      expect(mockPhotoService.getPhotoById).toHaveBeenCalledWith('test-user-id', '1');
    });

    it('should return 404 if photo not found', async () => {
        mockPhotoService.getPhotoById.mockRejectedValue(new PhotoBlogError('Photo not found', 404));

        const response = await request(app).get('/photos/v1/photos/1');

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Photo not found');
    });
  });

  describe('POST /v1/photos/:id/like', () => {
    it('should like a photo successfully', async () => {
      mockPhotoService.likePhoto.mockResolvedValue(undefined);

      const response = await request(app).post('/photos/v1/photos/1/like');

      expect(response.status).toBe(204);
      expect(mockPhotoService.likePhoto).toHaveBeenCalledWith('test-user-id', '1');
    });
  });

  describe('DELETE /v1/photos/:id/like', () => {
    it('should unlike a photo successfully', async () => {
      mockPhotoService.unlikePhoto.mockResolvedValue(undefined);

      const response = await request(app).delete('/photos/v1/photos/1/like');

      expect(response.status).toBe(204);
      expect(mockPhotoService.unlikePhoto).toHaveBeenCalledWith('test-user-id', '1');
    });
  });

  describe('GET /private/v1/photos', () => {
    it('should get photos successfully', async () => {
      const photos = [{ id: '1', title: 'Test Photo' }];
      mockPhotoService.getPhotos.mockResolvedValue(photos);

      const response = await request(app).get('/photos/private/v1/photos');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(photos);
      expect(mockPhotoService.getPhotos).toHaveBeenCalledWith('test-user-id', expect.any(Object));
    });
  });

  describe('GET /private/v1/photos/:id', () => {
    it('should get a photo by id successfully', async () => {
      const photo = { id: '1', title: 'Test Photo' };
      mockPhotoService.getPhotoById.mockResolvedValue(photo);

      const response = await request(app).get('/photos/private/v1/photos/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(photo);
      expect(mockPhotoService.getPhotoById).toHaveBeenCalledWith('test-user-id', '1');
    });
  });
});
