
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import { createPhotoFileRouter } from './photo-file.router.js';
import { PhotoFileService } from '../services/photo-file.service.js';
import { PhotoBlogError } from '../errors/photoblog.error.js';
import { FileResolution } from '../models/photo-file.model.js';

vi.mock('../services/photo-file.service.js');

const tempImagePath = path.join(__dirname, 'temp-test-image.jpg');

describe('Photo File Router', () => {
  let app: Express;
  let mockPhotoFileService: any;
  let mockAuthenticate: any;

  beforeEach(() => {
    vi.clearAllMocks();

    if (!fs.existsSync(tempImagePath)) {
      fs.writeFileSync(tempImagePath, 'fake image data');
    }

    mockPhotoFileService = {
      getPhotoFileImageById: vi.fn(),
    };

    mockAuthenticate = vi.fn((req, res, next) => {
      req.body.user = { id: 'test-user-id' };
      next();
    });

    app = express();
    app.use(express.json());
    app.use('/photo-files', createPhotoFileRouter(mockPhotoFileService, mockAuthenticate));

    app.use((err: any, req: any, res: any, next: any) => {
      if (err instanceof PhotoBlogError) {
        res.status(err.statusCode).json({ error: err.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  });

  describe('GET /v1/photos/view/:fileId', () => {
    it('should return a photo file', async () => {
      mockPhotoFileService.getPhotoFileImageById.mockResolvedValue(tempImagePath);

      const response = await request(app)
        .get('/photo-files/v1/photos/view/123')
        .query({ resolution: FileResolution.ORIGINAL });

      expect(response.status).toBe(200);
      expect(mockPhotoFileService.getPhotoFileImageById).toHaveBeenCalledWith(
        { id: 'test-user-id' },
        '123',
        FileResolution.ORIGINAL
      );
    });

    it('should return 400 if resolution is missing', async () => {
        const response = await request(app)
            .get('/photo-files/v1/photos/view/123');

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Resolution is required');
    });
  });

  describe('GET /v1/photos/preview/:fileId', () => {
    it('should return a preview photo file', async () => {
        mockPhotoFileService.getPhotoFileImageById.mockResolvedValue(tempImagePath);

        const response = await request(app)
            .get('/photo-files/v1/photos/preview/123');

        expect(response.status).toBe(200);
        expect(mockPhotoFileService.getPhotoFileImageById).toHaveBeenCalledWith(
            { id: 'test-user-id' },
            '123',
            FileResolution.PREVIEW
        );
    });
  });

  describe('GET /private/v1/photos/view/:fileId', () => {
    it('should return a photo file', async () => {
      mockPhotoFileService.getPhotoFileImageById.mockResolvedValue(tempImagePath);

      const response = await request(app)
        .get('/photo-files/private/v1/photos/view/123')
        .query({ resolution: FileResolution.ORIGINAL });

      expect(response.status).toBe(200);
      expect(mockPhotoFileService.getPhotoFileImageById).toHaveBeenCalledWith(
        { id: 'test-user-id' },
        '123',
        FileResolution.ORIGINAL
      );
    });
  });

  describe('GET /private/v1/photos/preview/:fileId', () => {
    it('should return a preview photo file', async () => {
        mockPhotoFileService.getPhotoFileImageById.mockResolvedValue(tempImagePath);

        const response = await request(app)
            .get('/photo-files/private/v1/photos/preview/123');

        expect(response.status).toBe(200);
        expect(mockPhotoFileService.getPhotoFileImageById).toHaveBeenCalledWith(
            { id: 'test-user-id' },
            '123',
            FileResolution.PREVIEW
        );
    });
  });
});
