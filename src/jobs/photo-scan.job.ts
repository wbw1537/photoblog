import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

import sharp from 'sharp';
import exifr from 'exifr';
import { PhotoFile, Prisma, PhotoFileStatus } from '@prisma/client';
import { Logger } from 'log4js';

import { ScanStatusService, UpdateJobStatusType } from '../services/scan-status.service.js';
import { PhotoRepository } from '../repositories/photo.repository.js';
import { PhotoFileRepository } from '../repositories/photo-file.repository.js';
import { UserRepository } from '../repositories/user.repository.js';
import { LazyPhotoProcessorPool } from './lazy-photo-processor-pool.js';

import { PhotoBlogError } from '../errors/photoblog.error.js';
import { placeholder, ValidatedUserForScan } from '../models/user.model.js';
import { PhotoFileForScan } from '../models/photo-file.model.js';
import { PhotoProcessorPool } from './photo-processor-pool.js';

// exifr data structure
interface ExifrData {
  ISO?: number;
  ExposureTime?: number;
  FNumber?: number;
  Make?: string;
  Model?: string;
  LensMake?: string;
  LensModel?: string;
  LensInfo?: string;
  FocalLength?: number;
  FocalLengthIn35mmFormat?: number;
  DateTimeOriginal?: string | Date;
  OffsetTime?: string;
  ModifyDate?: string | Date;
  latitude?: number;
  longitude?: number;
  GPSDateStamp?: string | Date;
}

interface PhotoScanDiffs {
  // Photo files in database but not in file system
  notMatchedPhotoFilesMap: Map<string, PhotoFileForScan>;
  // Photo files in file system and database
  matchedPhotoFilesMap: Map<string, PhotoFileForScan>;
  // Photo files in file system but not in database
  increased: string[];
}

export class PhotoScanJob {
  constructor(
    private photoRepository: PhotoRepository,
    private userRepository: UserRepository,
    private photoFileRepository: PhotoFileRepository,
    private scanStatusService: ScanStatusService,
    private logger: Logger,
    private lazyProcessorPool: LazyPhotoProcessorPool,
  ) { }

  async startPhotoScanJob(userId: string, jobId: string, isDeltaScan: boolean = true): Promise<void> {
    try {
      this.logger.info(`Starting photo scan job. UserId: ${userId}, JobId: ${jobId}, DeltaScan: ${isDeltaScan}`);
      const user = await this.getValidatedUser(userId);
      this.scanStatusService.initializeScanJob(user.id, jobId);

      // Get worker pool (lazy initialization)
      const processorPool = await this.lazyProcessorPool.getPool();

      // Compare with paths
      const photoFilesMap = new Map<string, PhotoFileForScan>();

      user.photos.forEach(photo => {
        photo.files.forEach((file) => {
          photoFilesMap.set(file.filePath, file);
        });
      });

      this.logger.info(`Found ${photoFilesMap.size} existing photos in database`);

      const photoScanDiffs: PhotoScanDiffs = {
        notMatchedPhotoFilesMap: photoFilesMap,
        matchedPhotoFilesMap: new Map<string, PhotoFileForScan>(),
        increased: [],
      }
      await this.getPhotoPathsAndCompare(user.id, user.localUser.basePath, photoScanDiffs)

      // Scan files
      await this.scanPhoto(
        user,
        photoScanDiffs.increased,
        photoScanDiffs.notMatchedPhotoFilesMap,
        photoScanDiffs.matchedPhotoFilesMap,
        isDeltaScan,
        processorPool
      );

      // Wait for all workers to complete
      await processorPool.waitForCompletion();

      // Release pool (starts idle timer)
      await this.lazyProcessorPool.releasePool();

      // Update job status
      this.scanStatusService.completeScanJob(user.id);
      this.logger.info(`Completed photo scan job. UserId: ${userId}, JobId: ${jobId}`);
    } catch (error) {
      this.logger.error(`Failed to execute photo scan job. UserId: ${userId}, JobId: ${jobId}:`, error);
      this.scanStatusService.setScanJobError(userId);

      // Release pool on error too
      await this.lazyProcessorPool.releasePool();
    }
  }

  private async getValidatedUser(userId: string) {
    const user = await this.userRepository.findLocalUserPhotosForScan(userId);
    if (!user) {
      throw new PhotoBlogError('User not found', 404);
    }
    if (!user.localUser) {
      throw new PhotoBlogError('Local user property not found', 500);
    }
    if (user.localUser.basePath === placeholder || user.localUser.cachePath === placeholder) {
      throw new PhotoBlogError('User base path or cache path not set', 400);
    }
    return user as ValidatedUserForScan; 
  }

  private async getPhotoPathsAndCompare(userId: string, photoBasePath: string, photoScanDiffs: PhotoScanDiffs): Promise<void> {
    await this.walk(photoBasePath, photoBasePath, photoScanDiffs);
    this.logger.info(
      `Scan comparison complete - New: ${photoScanDiffs.increased.length}, ` +
      `Not matched: ${photoScanDiffs.notMatchedPhotoFilesMap.size}, ` +
      `Matched: ${photoScanDiffs.matchedPhotoFilesMap.size}`
    );
    this.scanStatusService.setScanJobInProgress(
      userId,
      photoScanDiffs.increased.length,
      photoScanDiffs.notMatchedPhotoFilesMap.size,
      photoScanDiffs.matchedPhotoFilesMap.size);
  }

  private async walk(dir: string, photoBasePath: string, photoScanDiffs: PhotoScanDiffs): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const filePath = entry.name;
        const fullPath = path.join(dir, filePath);
        if (entry.isDirectory()) {
          await this.walk(fullPath, photoBasePath, photoScanDiffs);
        } else {
          // get relative path
          const relativePath = path.relative(photoBasePath, fullPath);
          this.comparePhotoFile(relativePath, photoScanDiffs);
        }
      }
    } catch (error) {
      this.logger.error(`Error walking directory ${dir}:`, error);
      throw error;
    }
  }

  private comparePhotoFile(filePath: string, photoScanDiffs: PhotoScanDiffs): void {
    if (!this.isPhotoFile(filePath)) {
      return;
    }
    // If the file path could be found in notMatchedPhotoFilesMap
    // move it to matchedPhotoFilesMap
    // otherwise add it to increased
    const photoFile = photoScanDiffs.notMatchedPhotoFilesMap.get(filePath);
    if (photoFile !== undefined) {
      photoScanDiffs.matchedPhotoFilesMap.set(filePath, photoFile);
      photoScanDiffs.notMatchedPhotoFilesMap.delete(filePath);
    } else {
      photoScanDiffs.increased.push(filePath);
    }
  }

  private async scanPhoto(
    user: ValidatedUserForScan,
    increased: string[],
    notMatched: Map<string, PhotoFileForScan>,
    matched: Map<string, PhotoFileForScan>,
    isDeltaScan: boolean,
    processorPool: PhotoProcessorPool
  ): Promise<void> {
    await this.processIncreasedFiles(user, increased, notMatched, processorPool);
    await this.processNotMatchedFiles(user, notMatched);

    if (!isDeltaScan) {
      await this.processMatchedFiles(user, matched, processorPool);
    }
  }

  private async processIncreasedFiles(
    user: ValidatedUserForScan,
    increased: string[],
    notMatched: Map<string, PhotoFileForScan>,
    processorPool: PhotoProcessorPool
  ): Promise<void> {
    this.logger.info(`Processing ${increased.length} increased files for creation`);
    // Sort files by path for optimal HDD sequential reads
    const sortedFiles = increased.sort();

    for (const filePath of sortedFiles) {
      try {
        const fullPath = path.join(user.localUser.basePath, filePath);
        // SINGLE file read into buffer
        const fileBuffer = await fs.readFile(fullPath);
        // Compute hash from buffer (already in memory)
        const fileHash = crypto.createHash('md5').update(fileBuffer).digest('hex');
        // Extract EXIF from buffer with exifr
        const exifData = await exifr.parse(fileBuffer, {
          tiff: true,
          exif: true,
          gps: true,
        });

        // Get basic metadata from Sharp
        const metadata = await sharp(fileBuffer).metadata();
        // Check if file was moved (hash match with not matched files)
        const matchedPhotoFile = await this.findHashMatchedPhotoFile(fileHash, notMatched);

        if (matchedPhotoFile !== null) {
          this.logger.debug(`Found hash match for ${filePath} -> ${matchedPhotoFile.filePath}`);
          await this.photoFileRepository.updateFilePathById(matchedPhotoFile.id, filePath);
          notMatched.delete(matchedPhotoFile.filePath);
          this.scanStatusService.updateInProgressScanJob(user.id, UpdateJobStatusType.NOT_MATCHED_MATCHED_WITH_INCREASED);
        } else {
          // Create new photo with metadata from exifr
          await this.createNewPhotoWithFile(user, filePath, exifData, metadata, fileHash);
          this.scanStatusService.updateInProgressScanJob(user.id, UpdateJobStatusType.INCREASED_SCANNED);
        }

        // Submit to worker pool for preview generation
        await processorPool.addTask({
          buffer: fileBuffer,
          outputPath: this.getPreviewPath(user, filePath),
          filePath
        });
      } catch (error) {
        this.logger.error(`Failed to process increased file ${filePath}:`, error);
      }
    }
  }

  private async processNotMatchedFiles(user: ValidatedUserForScan, notMatched: Map<string, PhotoFileForScan>): Promise<void> {
    this.logger.info(`Processing ${notMatched.size} not matched files for deletion`);
    for (const [, photoFile] of notMatched) {
      try {
        this.logger.debug(`Deleting photo file: ${photoFile.filePath}`);
        await Promise.all([
          this.deleteNotMatchedPhotos(photoFile),
          this.deletePreview(user, photoFile.filePath)
        ]);
        this.scanStatusService.updateInProgressScanJob(user.id, UpdateJobStatusType.NOT_MATCHED_DELETED);
      } catch (error) {
        this.logger.error(`Failed to delete photo file ${photoFile.filePath}:`, error);
      }
    }
  }

  private async processMatchedFiles(
    user: ValidatedUserForScan,
    matched: Map<string, PhotoFileForScan>,
    processorPool: PhotoProcessorPool
  ): Promise<void> {
    this.logger.info(`Processing ${matched.size} matched files for updates`);

    // Sort matched files for sequential HDD reads
    const sortedMatched = Array.from(matched.values()).sort((a, b) =>
      a.filePath.localeCompare(b.filePath)
    );

    for (const photoFile of sortedMatched) {
      try {
        const fullPath = path.join(user.localUser.basePath, photoFile.filePath);
        // SINGLE file read into buffer
        const fileBuffer = await fs.readFile(fullPath);
        // Compute hash from buffer
        const fileHash = crypto.createHash('md5').update(fileBuffer).digest('hex');

        // Check if file has changed
        if (photoFile.fileHash !== fileHash) {
          this.logger.debug(`Updating changed file: ${photoFile.filePath}`);
          // Extract EXIF from buffer with exifr
          const exifData = await exifr.parse(fileBuffer, {
            tiff: true,
            exif: true,
            gps: true,
          });

          // Get basic metadata from Sharp
          const metadata = await sharp(fileBuffer).metadata();
          // Update photo and file metadata
          await this.updatePhotoAndFile(photoFile, exifData, metadata, fileHash);
          this.scanStatusService.updateInProgressScanJob(user.id, UpdateJobStatusType.MATCHED_UPDATED);
        }

        // Regenerate preview (submit to worker pool)
        await processorPool.addTask({
          buffer: fileBuffer,
          outputPath: this.getPreviewPath(user, photoFile.filePath),
          filePath: photoFile.filePath
        });

      } catch (error) {
        this.logger.error(`Failed to process matched file ${photoFile.filePath}:`, error);
      }
    }
  }

  private async createNewPhotoWithFile(
    user: ValidatedUserForScan,
    filePath: string,
    exifData: ExifrData | undefined,
    metadata: sharp.Metadata,
    fileHash: string
  ): Promise<void> {
    try {
      const photo: Prisma.PhotoCreateInput = {
        user: { connect: { id: user.id } },
        title: path.basename(filePath),
        ...this.extractPhotoMetadata(exifData),
        files: {
          create: this.extractFileMetadata(filePath, exifData, metadata, fileHash)
        }
      };
      await this.photoRepository.create(photo);
    } catch (error) {
      this.logger.error(`Failed to create photo with file ${filePath}:`, error);
      throw error;
    }
  }

  private async updatePhotoAndFile(
    photoFile: PhotoFileForScan,
    exifData: ExifrData | undefined,
    metadata: sharp.Metadata,
    fileHash: string
  ): Promise<void> {
    if (photoFile.status === PhotoFileStatus.Source) {
      const photo = await this.photoRepository.findById(photoFile.photoId);
      if (photo) {
        Object.assign(photo, {
          title: path.basename(photoFile.filePath),
          ...this.extractPhotoMetadata(exifData)
        });
        await this.photoRepository.update(photo);
      }
    }

    const updatedPhotoFile: PhotoFile = {
      ...photoFile,
      ...this.extractFileMetadata(photoFile.filePath, exifData, metadata, fileHash)
    } as PhotoFile;

    await this.photoFileRepository.update(updatedPhotoFile);
  }

  private extractPhotoMetadata(exifData: ExifrData | undefined) {
    if (!exifData) {
      return {
        iso: null,
        exposureTime: null,
        exposureTimeValue: null,
        fNumber: null,
        cameraMake: null,
        cameraModel: null,
        lensMake: null,
        lensModel: null,
        focalLength: null,
        focalLength35mm: null,
        dateTaken: null,
        timeZone: null,
        gpsLatitude: null,
        gpsLongitude: null,
        gpsTimestamp: null,
      };
    }

    return {
      iso: exifData.ISO || null,
      exposureTime: this.convertExposureTime(exifData.ExposureTime),
      exposureTimeValue: exifData.ExposureTime?.toString() || null,
      fNumber: exifData.FNumber || null,
      cameraMake: exifData.Make || null,
      cameraModel: exifData.Model || null,
      lensMake: exifData.LensMake || null,
      lensModel: exifData.LensModel || exifData.LensInfo || null,
      focalLength: exifData.FocalLength || null,
      focalLength35mm: exifData.FocalLengthIn35mmFormat || null,
      dateTaken: exifData.DateTimeOriginal ? new Date(exifData.DateTimeOriginal) : null,
      timeZone: exifData.OffsetTime || null,
      gpsLatitude: exifData.latitude || null,
      gpsLongitude: exifData.longitude || null,
      gpsTimestamp: exifData.GPSDateStamp ? new Date(exifData.GPSDateStamp) : null,
    };
  }

  private convertExposureTime(exposureTime?: number | string): number | undefined {
    if (!exposureTime) {
      return undefined;
    }

    // exifr returns exposure time as a number
    if (typeof exposureTime === 'number') {
      return exposureTime;
    }

    // Handle string format (fallback)
    if (typeof exposureTime === 'string') {
      if (exposureTime.includes('/')) {
        const parts = exposureTime.split('/');
        const numerator = parseInt(parts[0], 10);
        const denominator = parseInt(parts[1], 10);

        if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
          return numerator / denominator;
        }
      } else {
        const number = parseFloat(exposureTime);
        if (!isNaN(number)) {
          return number;
        }
      }
    }

    return undefined;
  }

  private extractFileMetadata(filePath: string, exifData: ExifrData | undefined, metadata: sharp.Metadata, fileHash: string) {
    return {
      fileName: path.basename(filePath),
      fileType: filePath.split('.').pop() || '',
      filePath: filePath,
      fileHash: fileHash,
      fileSize: metadata.size || 0,
      fileModifiedTime: exifData?.ModifyDate ? new Date(exifData.ModifyDate) : new Date(),
      fileAccessDate: new Date(),
      imageHeight: metadata.height || 0,
      imageWidth: metadata.width || 0,
      orientation: metadata.orientation || 0,
    };
  }

  private getPreviewPath(user: ValidatedUserForScan, filePath: string): string {
    const fileHash = crypto.createHash('md5').update(filePath).digest('hex');
    const hashPrefix = fileHash.substring(0, 2);
    return path.join(user.localUser.cachePath, 'previews', hashPrefix, `${fileHash}.webp`);
  }

  private async findHashMatchedPhotoFile(
    hash: string,
    notMatchedPhotoFilesMap: Map<string, PhotoFileForScan>): Promise<PhotoFileForScan | null> {
    for (const [, photoFile] of notMatchedPhotoFilesMap) {
      if (photoFile.fileHash === hash) {
        return photoFile;
      }
    }
    return null;
  }

  private async deleteNotMatchedPhotos(photoFile: PhotoFileForScan) {
    // If the photo file is source and has only one file, delete the photo as well
    if (photoFile.status === PhotoFileStatus.Source) {
      const fileCount = await this.photoFileRepository.countFilesByPhotoId(photoFile.photoId);
      if (fileCount === 1) {
        await this.photoRepository.deletePhotoAndFiles(photoFile.photoId);
      }
    } else {
      await this.photoFileRepository.delete(photoFile.id);
    }
  }

  private isPhotoFile(filePath: string): boolean {
    const commonExt: Set<string> = new Set([
      // Common Image File Extensions
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.tif', '.webp', '.heic', '.heif', '.psd',

      // Camera RAW File Extensions
      '.crw', '.cr2', '.cr3', // Canon
      '.nef', '.nrw',         // Nikon
      '.arw', '.srf', '.sr2', // Sony
      '.raf',                 // Fujifilm
      '.orf',                 // Olympus
      '.rw2',                 // Panasonic
      '.dng',                 // Leica
      '.pef',                 // Pentax
      '.3fr',                 // Hasselblad
      '.x3f',                 // Sigma
      '.iiq',                 // Phase One
      '.srw',                 // Samsung
      '.mef',                 // Mamiya
      '.mrw',                 // Minolta
      '.dcr', '.k25', '.kdc'  // Kodak
    ]);
    const ext = path.extname(filePath).toLowerCase();
    return commonExt.has(ext);
  }

  private async deletePreview(user: ValidatedUserForScan, filePath: string): Promise<void> {
    const fileHash = crypto.createHash('md5').update(filePath).digest('hex');
    const hashPrefix = fileHash.substring(0, 2);
    const previewPhotoFullPath = path.join(user.localUser.cachePath, 'previews', hashPrefix, `${fileHash}.webp`);

    try {
      await fs.unlink(previewPhotoFullPath);
      this.logger.info(`Successfully deleted preview: ${previewPhotoFullPath}`);
    } catch (error: unknown) {
      // Don't error if the file doesn't exist (ENOENT)
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        this.logger.error(`Error deleting preview ${previewPhotoFullPath}:`, error);
        throw error;
      } else {
        this.logger.debug(`Preview file doesn't exist: ${previewPhotoFullPath}`);
      }
    }
  }
}
