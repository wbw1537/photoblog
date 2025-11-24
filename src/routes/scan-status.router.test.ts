
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';
import { createScanStatusRouter } from './scan-status.router.js';
import { PhotoBlogError } from '../errors/photoblog.error.js';

vi.mock('../services/scan-status.service.js');

describe('Scan Status Router', () => {
  let app: Express;
  let mockScanStatusService: any;
  let mockAuthenticate: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockScanStatusService = {
      getScanStatus: vi.fn(),
    };

    mockAuthenticate = vi.fn((req, res, next) => {
      req.body.user = { id: 'test-user-id' };
      next();
    });

    app = express();
    app.use(express.json());
    app.use('/scan-status', createScanStatusRouter(mockScanStatusService, mockAuthenticate));

    app.use((err: any, req: any, res: any, next: any) => {
      if (err instanceof PhotoBlogError) {
        res.status(err.statusCode).json({ error: err.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  });

  describe('GET /v1/scan-status', () => {
    it('should get scan status successfully', async () => {
      const status = { scanning: false, total: 100, processed: 50 };
      mockScanStatusService.getScanStatus.mockReturnValue(status);

      const response = await request(app).get('/scan-status/v1/scan-status');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(status);
      expect(mockScanStatusService.getScanStatus).toHaveBeenCalledWith('test-user-id');
    });
  });
});
