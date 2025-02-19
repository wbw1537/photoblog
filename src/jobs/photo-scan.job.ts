import fs from 'fs/promises';
import path from 'path';

import { ExifDateTime, ExifTool, Tags } from 'exiftool-vendored';
import { PhotoFile, Prisma, User, PhotoFileStatus } from '@prisma/client';
import { Logger } from 'log4js';

import { ScanStatusService, UpdateJobStatusType } from '../services/scan-status.service.js';
import { PhotoRepository } from '../repositories/photo.repository.js';
import { PhotoFileRepository } from '../repositories/photo-file.repository.js';
import { UserRepository } from '../repositories/user.repository.js';

import { PhotoBlogError } from '../errors/photoblog.error.js';

interface PhotoScanDiffs {
  // Photo files in database but not in file system
  notMatchedPhotoFilesMap: Map<string, PhotoFile>;
  // Photo files in file system and database
  matchedPhotoFilesMap: Map<string, PhotoFile>;
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
  ) {

  }
  async startPhotoScanJob(userId: string, jobId: string, isDeltaScan: boolean = true): Promise<void> {
    this.logger.info(`Starting photo scan job. UserId: ${userId}, JobId: ${jobId}, DeltaScan: ${isDeltaScan}`);
    const user = await this.userRepository.findAllById(userId);
    if (!user) {
      throw new PhotoBlogError('User not found', 404);
    }
    this.scanStatusService.initializeScanJob(user.id, jobId);
    
    // Compare with paths
    const photoFilesMap = new Map<string, PhotoFile>();

    user.photos.forEach(photo => {
      photo.files.forEach((file: PhotoFile) => {
        photoFilesMap.set(file.filePath, file);
      });
    });

    this.logger.info(`Found ${photoFilesMap.size} existing photos in database`);

    const photoScanDiffs: PhotoScanDiffs = {
      notMatchedPhotoFilesMap: photoFilesMap,
      matchedPhotoFilesMap: new Map<string, PhotoFile>(),
      increased: [],
    }
    await this.getPhotoPathsAndCompare(user.id, user.basePath, photoScanDiffs)

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
    user: User,
    increased: string[],
    notMatched: Map<string, PhotoFile>,
    matched: Map<string, PhotoFile>,
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
    user: User,
    increased: string[],
    notMatched: Map<string, PhotoFile>,
    exifTool: ExifTool
  ): Promise<void> {
    this.logger.info(`Processing ${increased.length} increased files for creation`);
    for (const filePath of increased) {
      try {
        const tags = await exifTool.read(path.join(user.basePath, filePath));
        const matchedPhotoFile = await this.findHashMatchedPhotoFile(tags.ImageDataHash || '', notMatched);

        if (matchedPhotoFile !== null) {
          this.logger.debug(`Found hash match for ${filePath} -> ${matchedPhotoFile.filePath}`);
          await this.photoFileRepository.updateFilePathById(matchedPhotoFile.id, filePath);
          notMatched.delete(matchedPhotoFile.filePath);
          this.scanStatusService.updateInProgressScanJob(user.id, UpdateJobStatusType.NOT_MATCHED_MATCHED_WITH_INCREASED);
          continue;
        }

        await this.createNewPhotoWithFile(user, filePath, tags);
      } catch (error) {
        this.logger.error(`Failed to process increased file ${filePath}:`, error);
      }
    }
  }

  private async processNotMatchedFiles(user: User, notMatched: Map<string, PhotoFile>): Promise<void> {
    this.logger.info(`Processing ${notMatched.size} not matched files for deletion`);
    for (const [, photoFile] of notMatched) {
      try {
        this.logger.debug(`Deleting photo file: ${photoFile.filePath}`);
        await this.deleteNotMatchedPhotos(user, photoFile);
        this.scanStatusService.updateInProgressScanJob(user.id, UpdateJobStatusType.NOT_MATCHED_DELETED);
      } catch (error) {
        this.logger.error(`Failed to delete photo file ${photoFile.filePath}:`, error);
      }
    }
  }

  private async processMatchedFiles(
    user: User,
    matched: Map<string, PhotoFile>,
    exifTool: ExifTool
  ): Promise<void> {
    this.logger.info(`Processing ${matched.size} matched files for updates`);
    for (const [, photoFile] of matched) {
      try {
        const tags = await exifTool.read(path.join(user.basePath, photoFile.filePath));
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

  private async createNewPhotoWithFile(user: User, filePath: string, tags: Tags): Promise<void> {
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

  private async updatePhotoAndFile(photoFile: PhotoFile, tags: Tags): Promise<void> {
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

    Object.assign(photoFile, this.extractFileMetadata(photoFile.filePath, tags));
    await this.photoFileRepository.update(photoFile);
  }

  private extractPhotoMetadata(tags: Tags) {
    return {
      iso: tags.ISO,
      exposureTime: tags.ExposureTime,
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
    };
  }

  private async findHashMatchedPhotoFile(
    hash: string,
    notMatchedPhotoFilesMap: Map<string, PhotoFile>): Promise<PhotoFile | null> {
    for (const [ ,photoFile] of notMatchedPhotoFilesMap) {
      if (photoFile.fileHash === hash) {
        return photoFile;
      }
    }
    return null;
  }

  private async deleteNotMatchedPhotos(user: User, photoFile: PhotoFile) {
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