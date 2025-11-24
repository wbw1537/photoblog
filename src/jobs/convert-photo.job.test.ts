import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConvertPhotoJob } from './convert-photo.job.js';
import { Logger } from 'log4js';
import { exec } from 'child_process';
import fs from 'fs/promises';
import { ValidatedUserForScan } from '../models/user.model.js';

// Mock dependencies
vi.mock('child_process');
vi.mock('fs/promises');

describe('ConvertPhotoJob', () => {
  let convertPhotoJob: ConvertPhotoJob;
  let mockLogger: Logger;

  const mockUser: ValidatedUserForScan = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    localUser: {
      userId: 'user-1',
      basePath: '/base/path',
      cachePath: '/cache/path',
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
    convertPhotoJob = new ConvertPhotoJob(mockLogger);
  });

  describe('convertToPreview', () => {
    it('should successfully convert image to preview', async () => {
      const filePath = 'test/photo.jpg';
      (fs.mkdir as any).mockResolvedValue(undefined);
      (exec as any).mockImplementation((cmd: string, callback: Function) => {
        callback(null, '', '');
      });

      await convertPhotoJob.convertToPreview(mockUser, filePath);

      expect(fs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('/cache/path/previews/'),
        { recursive: true }
      );
      expect(exec).toHaveBeenCalledWith(
        expect.stringContaining('magick'),
        expect.any(Function)
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Successfully converted')
      );
    });

    it('should log warning when conversion produces stderr', async () => {
      const filePath = 'test/photo.jpg';
      (fs.mkdir as any).mockResolvedValue(undefined);
      (exec as any).mockImplementation((cmd: string, callback: Function) => {
        callback(null, '', 'Warning message');
      });

      await convertPhotoJob.convertToPreview(mockUser, filePath);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Warning during conversion')
      );
    });

    it('should throw error when conversion fails', async () => {
      const filePath = 'test/photo.jpg';
      const error = new Error('Conversion failed');
      (fs.mkdir as any).mockResolvedValue(undefined);
      (exec as any).mockImplementation((cmd: string, callback: Function) => {
        callback(error, '', '');
      });

      await expect(
        convertPhotoJob.convertToPreview(mockUser, filePath)
      ).rejects.toThrow('Conversion failed');

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error converting image')
      );
    });

    it('should throw error when directory creation fails', async () => {
      const filePath = 'test/photo.jpg';
      const error = new Error('Directory creation failed');
      (fs.mkdir as any).mockRejectedValue(error);

      await expect(
        convertPhotoJob.convertToPreview(mockUser, filePath)
      ).rejects.toThrow('Directory creation failed');

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to create preview'),
        error
      );
    });

    it('should generate correct hash-based file path', async () => {
      const filePath = 'test/photo.jpg';
      (fs.mkdir as any).mockResolvedValue(undefined);
      (exec as any).mockImplementation((cmd: string, callback: Function) => {
        callback(null, '', '');
      });

      await convertPhotoJob.convertToPreview(mockUser, filePath);

      // Verify that mkdir was called with a hash-based directory structure
      expect(fs.mkdir).toHaveBeenCalledWith(
        expect.stringMatching(/\/cache\/path\/previews\/[a-f0-9]{2}$/),
        { recursive: true }
      );
    });
  });

  describe('deletePreview', () => {
    it('should successfully delete preview', async () => {
      const filePath = 'test/photo.jpg';
      (fs.unlink as any).mockResolvedValue(undefined);

      await convertPhotoJob.deletePreview(mockUser, filePath);

      expect(fs.unlink).toHaveBeenCalledWith(
        expect.stringContaining('/cache/path/previews/')
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Successfully deleted preview')
      );
    });

    it('should not throw error when file does not exist (ENOENT)', async () => {
      const filePath = 'test/photo.jpg';
      const error: NodeJS.ErrnoException = new Error('File not found');
      error.code = 'ENOENT';
      (fs.unlink as any).mockRejectedValue(error);

      await expect(
        convertPhotoJob.deletePreview(mockUser, filePath)
      ).resolves.not.toThrow();

      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining("Preview file doesn't exist")
      );
    });

    it('should throw error for non-ENOENT errors', async () => {
      const filePath = 'test/photo.jpg';
      const error: NodeJS.ErrnoException = new Error('Permission denied');
      error.code = 'EACCES';
      (fs.unlink as any).mockRejectedValue(error);

      await expect(
        convertPhotoJob.deletePreview(mockUser, filePath)
      ).rejects.toThrow('Permission denied');

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error deleting preview'),
        error
      );
    });

    it('should use hash-based path for deletion', async () => {
      const filePath = 'test/photo.jpg';
      (fs.unlink as any).mockResolvedValue(undefined);

      await convertPhotoJob.deletePreview(mockUser, filePath);

      // Verify that unlink was called with a hash-based path
      expect(fs.unlink).toHaveBeenCalledWith(
        expect.stringMatching(/\/cache\/path\/previews\/[a-f0-9]{2}\/[a-f0-9]{32}\.webp$/)
      );
    });
  });
});
