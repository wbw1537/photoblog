
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';
import { createPhotoScanRouter } from './photo-scan.router.js';
import { PhotoBlogError } from '../errors/photoblog.error.js';

vi.mock('../services/photo-scan.service.js');

describe('Photo Scan Router', () => {
  let app: Express;
  let mockPhotoScanService: any;
  let mockAuthenticate: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPhotoScanService = {
      scan: vi.fn(),
      deltaScan: vi.fn(),
    };

    mockAuthenticate = vi.fn((req, res, next) => {
      req.body.user = { id: 'test-user-id' };
      next();
    });

    app = express();
    app.use(express.json());
    app.use('/photo-scan', createPhotoScanRouter(mockPhotoScanService, mockAuthenticate));

    app.use((err: any, req: any, res: any, next: any) => {
      if (err instanceof PhotoBlogError) {
        res.status(err.statusCode).json({ error: err.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  });

  describe('POST /v1/scan', () => {
    it('should start a scan job', async () => {
      mockPhotoScanService.scan.mockResolvedValue('job-123');

      const response = await request(app).post('/photo-scan/v1/scan');

      expect(response.status).toBe(202);
      expect(response.body).toEqual({ jobId: 'job-123' });
      expect(mockPhotoScanService.scan).toHaveBeenCalledWith('test-user-id');
    });
  });

  describe('POST /v1/delta-scan', () => {
    it('should start a delta scan job', async () => {
      mockPhotoScanService.deltaScan.mockResolvedValue('job-456');

      const response = await request(app).post('/photo-scan/v1/delta-scan');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ jobId: 'job-456' });
      expect(mockPhotoScanService.deltaScan).toHaveBeenCalledWith('test-user-id');
    });
  });
});
