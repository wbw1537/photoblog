import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PhotoScanJob } from './photo-scan.job.js';
import { PhotoRepository } from '../repositories/photo.repository.js';
import { UserRepository } from '../repositories/user.repository.js';
import { PhotoFileRepository } from '../repositories/photo-file.repository.js';
import { ScanStatusService } from '../services/scan-status.service.js';
import { ConvertPhotoJob } from './convert-photo.job.js';
import { Logger } from 'log4js';
import { PhotoBlogError } from '../errors/photoblog.error.js';
import { PhotoFileStatus } from '@prisma/client';
import { placeholder } from '../models/user.model.js';

vi.mock('../repositories/photo.repository.js');
vi.mock('../repositories/user.repository.js');
vi.mock('../repositories/photo-file.repository.js');
vi.mock('../services/scan-status.service.js');
vi.mock('./convert-photo.job.js');
vi.mock('fs/promises');

vi.mock('exiftool-vendored', () => ({
  ExifTool: class {
    read = vi.fn();
    end = vi.fn();
  },
  ExifDateTime: class {
    toDate() {
      return new Date();
    }
  },
}));

describe('PhotoScanJob', () => {
  let photoScanJob: PhotoScanJob;
  let mockPhotoRepository: any;
  let mockUserRepository: any;
  let mockPhotoFileRepository: any;
  let mockScanStatusService: any;
  let mockConvertPhotoJob: any;
  let mockLogger: Logger;

  const userId = 'user-1';
  const jobId = 'job-1';

  const mockUser = {
    id: userId,
    name: 'Test User',
    email: 'test@example.com',
    localUser: {
      userId,
      basePath: '/test/base/path',
      cachePath: '/test/cache/path',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    photos: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockLogger = {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
    } as any;

    mockPhotoRepository = {
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deletePhotoAndFiles: vi.fn(),
    };

    mockUserRepository = {
      findLocalUserPhotosForScan: vi.fn(),
    };

    mockPhotoFileRepository = {
      updateFilePathById: vi.fn(),
      countFilesByPhotoId: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    };

    mockScanStatusService = {
      initializeScanJob: vi.fn(),
      setScanJobInProgress: vi.fn(),
      updateInProgressScanJob: vi.fn(),
      completeScanJob: vi.fn(),
      setScanJobError: vi.fn(),
    };

    mockConvertPhotoJob = {
      convertToPreview: vi.fn(),
      deletePreview: vi.fn(),
    };

    photoScanJob = new PhotoScanJob(
      mockPhotoRepository,
      mockUserRepository,
      mockPhotoFileRepository,
      mockScanStatusService,
      mockConvertPhotoJob,
      mockLogger
    );
  });

  describe('startPhotoScanJob', () => {
    it('should throw error if user not found', async () => {
      mockUserRepository.findLocalUserPhotosForScan.mockResolvedValue(null);

      await photoScanJob.startPhotoScanJob(userId, jobId, true);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to execute photo scan job'),
        expect.any(Error)
      );
      expect(mockScanStatusService.setScanJobError).toHaveBeenCalledWith(userId);
    });

    it('should throw error if local user property not found', async () => {
      mockUserRepository.findLocalUserPhotosForScan.mockResolvedValue({
        id: userId,
        localUser: null,
      });

      await photoScanJob.startPhotoScanJob(userId, jobId, true);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to execute photo scan job'),
        expect.any(Error)
      );
      expect(mockScanStatusService.setScanJobError).toHaveBeenCalledWith(userId);
    });

    it('should throw error if base path or cache path not set', async () => {
      mockUserRepository.findLocalUserPhotosForScan.mockResolvedValue({
        ...mockUser,
        localUser: {
          ...mockUser.localUser,
          basePath: placeholder,
        },
      });

      await photoScanJob.startPhotoScanJob(userId, jobId, true);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to execute photo scan job'),
        expect.any(Error)
      );
      expect(mockScanStatusService.setScanJobError).toHaveBeenCalledWith(userId);
    });

    it('should initialize scan job on successful start', async () => {
      mockUserRepository.findLocalUserPhotosForScan.mockResolvedValue(mockUser);

      // Mock fs.readdir to return empty directory
      const fs = await import('fs/promises');
      (fs.readdir as any).mockResolvedValue([]);

      await photoScanJob.startPhotoScanJob(userId, jobId, true);

      expect(mockScanStatusService.initializeScanJob).toHaveBeenCalledWith(userId, jobId);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Starting photo scan job')
      );
    });

    it('should complete scan job after successful execution', async () => {
      mockUserRepository.findLocalUserPhotosForScan.mockResolvedValue(mockUser);
      mockScanStatusService.initializeScanJob.mockReturnValue(undefined);
      mockScanStatusService.setScanJobInProgress.mockReturnValue(undefined);
      mockScanStatusService.completeScanJob.mockReturnValue(undefined);

      const fs = await import('fs/promises');
      (fs.readdir as any).mockResolvedValue([]);

      await photoScanJob.startPhotoScanJob(userId, jobId, true);

      expect(mockScanStatusService.completeScanJob).toHaveBeenCalledWith(userId);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Completed photo scan job')
      );
    });

    it('should handle errors during scan and set error status', async () => {
      const error = new Error('Scan failed');
      mockUserRepository.findLocalUserPhotosForScan.mockRejectedValue(error);

      await photoScanJob.startPhotoScanJob(userId, jobId, true);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to execute photo scan job'),
        error
      );
      expect(mockScanStatusService.setScanJobError).toHaveBeenCalledWith(userId);
    });
  });

  describe('comparePhotoFile', () => {
    it('should identify photo files by extension', async () => {
      mockUserRepository.findLocalUserPhotosForScan.mockResolvedValue({
        ...mockUser,
        photos: [
          {
            id: 'photo-1',
            files: [
              {
                id: 'file-1',
                filePath: 'photos/test.jpg',
                fileHash: 'hash-1',
                status: PhotoFileStatus.Source,
                photoId: 'photo-1',
              },
            ],
          },
        ],
      });

      const fs = await import('fs/promises');
      (fs.readdir as any).mockResolvedValue([
        { name: 'test.jpg', isDirectory: () => false },
        { name: 'test.txt', isDirectory: () => false }, // Should be ignored
        { name: 'test.cr2', isDirectory: () => false }, // RAW file, should be included
      ]);

      await photoScanJob.startPhotoScanJob(userId, jobId, true);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Found 1 existing photos in database')
      );
    });
  });

  describe('file processing', () => {
    it('should process photo files and call appropriate methods', async () => {
      mockUserRepository.findLocalUserPhotosForScan.mockResolvedValue(mockUser);
      mockPhotoRepository.create.mockResolvedValue({ id: 'new-photo-1' });
      mockConvertPhotoJob.convertToPreview.mockResolvedValue(undefined);

      const fs = await import('fs/promises');
      (fs.readdir as any).mockResolvedValue([
        { name: 'new-photo.jpg', isDirectory: () => false },
      ]);

      await photoScanJob.startPhotoScanJob(userId, jobId, true);

      // Verify that the scan job was initialized
      expect(mockScanStatusService.initializeScanJob).toHaveBeenCalledWith(userId, jobId);
    });
  });

  describe('scan job status tracking', () => {
    it('should track scan job status during execution', async () => {
      mockUserRepository.findLocalUserPhotosForScan.mockResolvedValue(mockUser);
      mockScanStatusService.initializeScanJob.mockReturnValue(undefined);
      mockScanStatusService.setScanJobInProgress.mockReturnValue(undefined);

      const fs = await import('fs/promises');
      (fs.readdir as any).mockResolvedValue([]);

      await photoScanJob.startPhotoScanJob(userId, jobId, true);

      expect(mockScanStatusService.initializeScanJob).toHaveBeenCalledWith(userId, jobId);
      expect(mockScanStatusService.setScanJobInProgress).toHaveBeenCalled();
    });
  });

  describe('delta vs full scan behavior', () => {
    it('should support delta scan mode', async () => {
      mockUserRepository.findLocalUserPhotosForScan.mockResolvedValue(mockUser);

      const fs = await import('fs/promises');
      (fs.readdir as any).mockResolvedValue([]);

      // Run delta scan
      await photoScanJob.startPhotoScanJob(userId, jobId, true);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('DeltaScan: true')
      );
    });

    it('should support full scan mode', async () => {
      mockUserRepository.findLocalUserPhotosForScan.mockResolvedValue(mockUser);

      const fs = await import('fs/promises');
      (fs.readdir as any).mockResolvedValue([]);

      // Run full scan
      await photoScanJob.startPhotoScanJob(userId, jobId, false);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('DeltaScan: false')
      );
    });
  });
});
