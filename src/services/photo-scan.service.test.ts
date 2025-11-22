import { describe, it, expect, vi, beforeEach } from 'vitest';
import { v4 as uuidv4 } from 'uuid';

import { PhotoScanService } from './photo-scan.service.js';
import { PhotoBlogError } from '../errors/photoblog.error.js';

vi.mock('uuid');
vi.mock('./scan-status.service.js');
vi.mock('../jobs/photo-scan.job.js');

describe('PhotoScanService', () => {
  let photoScanService: PhotoScanService;
  let mockScanStatusService: any;
  let mockPhotoScanJob: any;

  const userId = 'user-1';
  const jobId = 'job-1';

  beforeEach(() => {
    vi.clearAllMocks();
    mockScanStatusService = {
      getScanStatus: vi.fn(),
    };
    mockPhotoScanJob = {
      startPhotoScanJob: vi.fn(),
    };
    photoScanService = new PhotoScanService(mockScanStatusService, mockPhotoScanJob);
    vi.mocked(uuidv4).mockReturnValue(jobId);
  });

  describe('scan', () => {
    it('should start a full scan job', async () => {
      mockScanStatusService.getScanStatus.mockReturnValue(null);
      const result = await photoScanService.scan(userId);

      expect(result).toBe(jobId);
      expect(mockScanStatusService.getScanStatus).toHaveBeenCalledWith(userId);
      expect(mockPhotoScanJob.startPhotoScanJob).toHaveBeenCalledWith(userId, jobId, false);
    });

    it('should throw an error if a scan is already in progress', async () => {
      mockScanStatusService.getScanStatus.mockReturnValue({ status: JobStatusType.IN_PROGRESS });

      await expect(photoScanService.scan(userId)).rejects.toThrow(
        new PhotoBlogError('Scan job already in progress', 409)
      );
      expect(mockPhotoScanJob.startPhotoScanJob).not.toHaveBeenCalled();
    });
  });

  describe('deltaScan', () => {
    it('should start a delta scan job', async () => {
      mockScanStatusService.getScanStatus.mockReturnValue(null);
      const result = await photoScanService.deltaScan(userId);

      expect(result).toBe(jobId);
      expect(mockScanStatusService.getScanStatus).toHaveBeenCalledWith(userId);
      expect(mockPhotoScanJob.startPhotoScanJob).toHaveBeenCalledWith(userId, jobId, true);
    });

    it('should throw an error if a scan is already initializing', async () => {
      mockScanStatusService.getScanStatus.mockReturnValue({ status: JobStatusType.INITIALIZING });

      await expect(photoScanService.deltaScan(userId)).rejects.toThrow(
        new PhotoBlogError('Scan job already in progress', 409)
      );
    });
  });
});
