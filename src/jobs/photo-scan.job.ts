import fs from 'fs/promises';
import path from 'path';

import { ExifDateTime, ExifTool, Tags } from 'exiftool-vendored';
import { PhotoFile, Prisma, PhotoFileStatus } from '@prisma/client';
import { Logger } from 'log4js';

import { ScanStatusService, UpdateJobStatusType } from '../services/scan-status.service.js';
import { PhotoRepository } from '../repositories/photo.repository.js';
import { PhotoFileRepository } from '../repositories/photo-file.repository.js';
import { UserRepository } from '../repositories/user.repository.js';
import { ConvertPhotoJob } from './convert-photo.job.js';

import { PhotoBlogError } from '../errors/photoblog.error.js';
import { placeholder, ValidatedUserForScan } from '../models/user.model.js';
import { PhotoFileForScan } from '../models/photo-file.model.js'

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
    private convertPhotoJob: ConvertPhotoJob,
    private logger: Logger,
  ) { }

  async startPhotoScanJob(userId: string, jobId: string, isDeltaScan: boolean = true): Promise<void> {
    try {
      this.logger.info(`Starting photo scan job. UserId: ${userId}, JobId: ${jobId}, DeltaScan: ${isDeltaScan}`);
      const user = await this.getValidatedUser(userId);
      this.scanStatusService.initializeScanJob(user.id, jobId);

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
      await this.scanPhoto(user,
        photoScanDiffs.increased,
        photoScanDiffs.notMatchedPhotoFilesMap,
        photoScanDiffs.matchedPhotoFilesMap,
        isDeltaScan
      );

      // Update job status
      this.scanStatusService.completeScanJob(user.id);
      this.logger.info(`Completed photo scan job. UserId: ${userId}, JobId: ${jobId}`);
    } catch (error) {
      this.logger.error(`Failed to execute photo scan job. UserId: ${userId}, JobId: ${jobId}:`, error);
      this.scanStatusService.setScanJobError(userId);
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
    isDeltaScan: boolean
  ): Promise<void> {
    const exifTool = new ExifTool({ imageHashType: 'MD5' });

    await this.processIncreasedFiles(user, increased, notMatched, exifTool);
    await this.processNotMatchedFiles(user, notMatched);

    if (!isDeltaScan) {
      await this.processMatchedFiles(user, matched, exifTool);
    }

    exifTool.end();
  }

  private async processIncreasedFiles(
    user: ValidatedUserForScan,
    increased: string[],
    notMatched: Map<string, PhotoFileForScan>,
    exifTool: ExifTool
  ): Promise<void> {
    this.logger.info(`Processing ${increased.length} increased files for creation`);
    for (const filePath of increased) {
      try {
        const tags = await exifTool.read(path.join(user.localUser.basePath, filePath));
        const matchedPhotoFile = await this.findHashMatchedPhotoFile(tags.ImageDataHash || '', notMatched);

        if (matchedPhotoFile !== null) {
          this.logger.debug(`Found hash match for ${filePath} -> ${matchedPhotoFile.filePath}`);
          await Promise.all([
            this.photoFileRepository.updateFilePathById(matchedPhotoFile.id, filePath),
            this.convertPhotoJob.convertToPreview(user, filePath)
          ]);
          notMatched.delete(matchedPhotoFile.filePath);
          this.scanStatusService.updateInProgressScanJob(user.id, UpdateJobStatusType.NOT_MATCHED_MATCHED_WITH_INCREASED);
          continue;
        }

        await Promise.all([
          this.createNewPhotoWithFile(user, filePath, tags),
          this.convertPhotoJob.convertToPreview(user, filePath)
        ]);

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
          this.convertPhotoJob.deletePreview(user, photoFile.filePath)
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
    exifTool: ExifTool
  ): Promise<void> {
    this.logger.info(`Processing ${matched.size} matched files for updates`);
    for (const [, photoFile] of matched) {
      try {
        const tags = await exifTool.read(path.join(user.localUser.basePath, photoFile.filePath));
        await this.convertPhotoJob.convertToPreview(user, photoFile.filePath)
        if (photoFile.fileHash !== tags.ImageDataHash) {
          this.logger.debug(`Updating changed file: ${photoFile.filePath}`);
          await this.updatePhotoAndFile(photoFile, tags);
          this.scanStatusService.updateInProgressScanJob(user.id, UpdateJobStatusType.MATCHED_UPDATED);
        }
      } catch (error) {
        this.logger.error(`Failed to process matched file ${photoFile.filePath}:`, error);
      }
    }
  }

  private async createNewPhotoWithFile(user: ValidatedUserForScan, filePath: string, tags: Tags): Promise<void> {
    try {
      const photo: Prisma.PhotoCreateInput = {
        user: { connect: { id: user.id } },
        title: path.basename(filePath),
        ...this.extractPhotoMetadata(tags),
        files: {
          create: this.extractFileMetadata(filePath, tags)
        }
      };
      await this.photoRepository.create(photo);
      this.scanStatusService.updateInProgressScanJob(user.id, UpdateJobStatusType.INCREASED_SCANNED);
    } catch (error) {
      this.logger.error(`Failed to create photo with file ${filePath}:`, error);
      throw error;
    }
  }

  private async updatePhotoAndFile(photoFile: PhotoFileForScan, tags: Tags): Promise<void> {
    if (photoFile.status === PhotoFileStatus.Source) {
      const photo = await this.photoRepository.findById(photoFile.photoId);
      if (photo) {
        Object.assign(photo, {
          title: path.basename(photoFile.filePath),
          ...this.extractPhotoMetadata(tags)
        });
        await this.photoRepository.update(photo);
      }
    }
    
    const updatedPhotoFile: PhotoFile = {
      ...photoFile, // spread the existing PhotoFileForScan data
      ...this.extractFileMetadata(photoFile.filePath, tags) // add the new metadata
    } as PhotoFile;

    await this.photoFileRepository.update(updatedPhotoFile);
  }

  private extractPhotoMetadata(tags: Tags) {
    return {
      iso: tags.ISO,
      exposureTime: this.convertExposureTime(tags.ExposureTime?.toString()),
      exposureTimeValue: tags.ExposureTime?.toString(),
      fNumber: tags.FNumber,
      cameraMake: tags.Make,
      cameraModel: tags.Model,
      lensMake: tags.LensMake,
      lensModel: tags.LensModel,
      focalLength: Number(tags.FocalLength?.split(' ')[0]),
      focalLength35mm: Number(tags.FocalLengthIn35mmFormat?.split(' ')[0]),
      dateTaken: tags.DateTimeOriginal instanceof ExifDateTime
        ? tags.DateTimeOriginal.toDate() : null,
      timeZone: tags.TimeZone,
      gpsLatitude: Number(tags.GPSLatitude),
      gpsLongitude: Number(tags.GPSLongitude),
      gpsTimestamp: tags.GPSTimeStamp instanceof ExifDateTime
        ? tags.GPSTimeStamp.toDate() : null,
    };
  }

  private convertExposureTime(exposureTime?: string): number | undefined {
    if (!exposureTime) {
      return undefined;
    }
    if (exposureTime.includes('/')) {
      const parts = exposureTime.split('/');
      const numerator = parseInt(parts[0], 10);
      const denominator = parseInt(parts[1], 10);

      if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
        return numerator / denominator;
      } else {
        throw new PhotoBlogError("Invalid fraction format or division by zero!", 400);
      }
    } else {
      const number = parseInt(exposureTime, 10);
      if (!isNaN(number)) {
        return number;
      } else {
        throw new PhotoBlogError("Invalid number format!", 400);
      }
    }
  }

  private extractFileMetadata(filePath: string, tags: Tags) {
    return {
      fileName: path.basename(filePath),
      fileType: filePath.split('.').pop() || '',
      filePath: filePath,
      fileHash: tags.ImageDataHash || '',
      fileSize: tags.FileSize ? parseInt(tags.FileSize, 10) : 0,
      fileModifiedTime: tags.FileModifyDate instanceof ExifDateTime ? tags.FileModifyDate.toDate() : new Date(tags.FileModifyDate || Date.now()),
      fileAccessDate: tags.FileAccessDate instanceof ExifDateTime ? tags.FileAccessDate.toDate() : new Date(tags.FileAccessDate || Date.now()),
      imageHeight: tags.ImageHeight || 0,
      imageWidth: tags.ImageWidth || 0,
      orientation: tags.Orientation || 0,
    };
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
}