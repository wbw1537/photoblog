import { describe, it, expect, beforeEach } from 'vitest';
import { ScanStatusService, JobStatusType, UpdateJobStatusType } from './scan-status.service.js';
import { PhotoBlogError } from '../errors/photoblog.error.js';

describe('ScanStatusService', () => {
  let scanStatusService: ScanStatusService;
  const userId = 'user-1';
  const jobId = 'job-1';

  beforeEach(() => {
    scanStatusService = new ScanStatusService();
  });

  describe('initializeScanJob', () => {
    it('should initialize a new scan job status', () => {
      scanStatusService.initializeScanJob(userId, jobId);
      const status = scanStatusService.getScanStatus(userId);

      expect(status).toBeDefined();
      expect(status?.jobId).toBe(jobId);
      expect(status?.status).toBe(JobStatusType.INITIALIZING);
      expect(status?.photosIncreased).toBe(0);
      expect(status?.photosIncreasedScanned).toBe(0);
    });
  });

  describe('setScanJobInProgress', () => {
    it('should set job status to in_progress and update counts', () => {
      scanStatusService.initializeScanJob(userId, jobId);
      scanStatusService.setScanJobInProgress(userId, 10, 5, 3);
      const status = scanStatusService.getScanStatus(userId);

      expect(status?.status).toBe(JobStatusType.IN_PROGRESS);
      expect(status?.photosIncreased).toBe(10);
      expect(status?.photosNotMatched).toBe(5);
      expect(status?.photosMatched).toBe(3);
    });

    it('should throw PhotoBlogError if job not found', () => {
      expect(() => scanStatusService.setScanJobInProgress('non-existent-user', 0, 0, 0)).toThrow(
        new PhotoBlogError('Job not found', 404)
      );
    });
  });

  describe('updateInProgressScanJob', () => {
    beforeEach(() => {
      scanStatusService.initializeScanJob(userId, jobId);
      scanStatusService.setScanJobInProgress(userId, 10, 5, 3);
    });

    it('should increase photosIncreasedScanned', () => {
      scanStatusService.updateInProgressScanJob(userId, UpdateJobStatusType.INCREASED_SCANNED);
      const status = scanStatusService.getScanStatus(userId);
      expect(status?.photosIncreasedScanned).toBe(1);
    });

    it('should increase photosNotMatchedMatchedWithIncrease', () => {
      scanStatusService.updateInProgressScanJob(userId, UpdateJobStatusType.NOT_MATCHED_MATCHED_WITH_INCREASED);
      const status = scanStatusService.getScanStatus(userId);
      expect(status?.photosNotMatchedMatchedWithIncrease).toBe(1);
    });

    it('should increase photosNotMatchedDeleted', () => {
      scanStatusService.updateInProgressScanJob(userId, UpdateJobStatusType.NOT_MATCHED_DELETED);
      const status = scanStatusService.getScanStatus(userId);
      expect(status?.photosNotMatchedDeleted).toBe(1);
    });

    it('should increase photosMatchedUpdated', () => {
      scanStatusService.updateInProgressScanJob(userId, UpdateJobStatusType.MATCHED_UPDATED);
      const status = scanStatusService.getScanStatus(userId);
      expect(status?.photosMatchedUpdated).toBe(1);
    });

    it('should throw PhotoBlogError if job not found', () => {
      expect(() => scanStatusService.updateInProgressScanJob('non-existent-user', UpdateJobStatusType.INCREASED_SCANNED)).toThrow(
        new PhotoBlogError('Job not found', 404)
      );
    });
  });

  describe('setScanJobError', () => {
    it('should set job status to ERROR if job exists', () => {
      scanStatusService.initializeScanJob(userId, jobId);
      scanStatusService.setScanJobError(userId);
      const status = scanStatusService.getScanStatus(userId);
      expect(status?.status).toBe(JobStatusType.ERROR);
    });

    it('should do nothing if job not found', () => {
      scanStatusService.setScanJobError('non-existent-user');
      const status = scanStatusService.getScanStatus('non-existent-user');
      expect(status).toBeUndefined();
    });
  });

  describe('completeScanJob', () => {
    it('should set job status to COMPLETED', () => {
      scanStatusService.initializeScanJob(userId, jobId);
      scanStatusService.completeScanJob(userId);
      const status = scanStatusService.getScanStatus(userId);
      expect(status?.status).toBe(JobStatusType.COMPLETED);
    });

    it('should throw PhotoBlogError if job not found', () => {
      expect(() => scanStatusService.completeScanJob('non-existent-user')).toThrow(
        new PhotoBlogError('Job not found', 404)
      );
    });
  });

  describe('getScanStatus', () => {
    it('should return scan status if found', () => {
      scanStatusService.initializeScanJob(userId, jobId);
      const status = scanStatusService.getScanStatus(userId);
      expect(status).toBeDefined();
    });

    it('should return undefined if scan status not found', () => {
      const status = scanStatusService.getScanStatus('non-existent-user');
      expect(status).toBeUndefined();
    });
  });

  describe('deleteJobStatus', () => {
    it('should delete scan status', () => {
      scanStatusService.initializeScanJob(userId, jobId);
      scanStatusService.deleteJobStatus(userId);
      const status = scanStatusService.getScanStatus(userId);
      expect(status).toBeUndefined();
    });
  });
});
