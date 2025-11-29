import path from 'path';
import crypto from 'crypto';
import { Prisma, PhotoFileStatus, PreviewStatus } from '@prisma/client';
import { Logger } from 'log4js';

import { MetadataExtractionService } from './metadata-extraction.service.js';
import { PhotoRepository } from '../repositories/photo.repository.js';
import { PhotoFileRepository } from '../repositories/photo-file.repository.js';
import { PhotoLocationRepository } from '../repositories/photo-location.repository.js';
import { ValidatedUserForScan } from '../models/user.model.js';
import { PhotoFileForScan } from '../models/photo-file.model.js';
import { LazyPhotoProcessorPool } from '../jobs/lazy-photo-processor-pool.js';
import { PhotoBlogError } from '../errors/photoblog.error.js';

/**
 * FileProcessingService - Facade for all file-level operations
 * Encapsulates metadata extraction, database updates, and preview queuing
 *
 * This service follows the "fat service, thin job" pattern:
 * - PhotoScanJob: Orchestrates scan workflow (walk, compare, delegate)
 * - FileProcessingService: Handles all file processing details
 */
export class FileProcessingService {
  constructor(
    private metadataService: MetadataExtractionService,
    private photoRepository: PhotoRepository,
    private photoFileRepository: PhotoFileRepository,
    private photoLocationRepository: PhotoLocationRepository,
    private lazyProcessorPool: LazyPhotoProcessorPool,
    private logger: Logger
  ) {}

  private async getPhotoFileById(id: string) {
    return await this.photoFileRepository.findById(id);
  }

  /**
   * Process a new file: extract metadata, create database records, queue preview
   */
  async processNewFile(
    user: ValidatedUserForScan,
    filePath: string,
    fileBuffer: Buffer,
    fullPath: string,
    fileHash: string
  ): Promise<void> {
    try {
      // Extract all metadata in one call (photo, file, gps)
      const metadata = await this.metadataService.extractMetadata(fullPath);

      // Create photo with file and location
      const photo: Prisma.PhotoCreateInput = {
        user: { connect: { id: user.id } },
        title: path.basename(filePath),
        ...metadata.photo,
        files: {
          create: {
            fileName: path.basename(filePath),
            fileType: filePath.split('.').pop() || '',
            filePath: filePath,
            fileHash: fileHash,
            fileSize: metadata.file.fileSize,
            fileModifiedTime: metadata.file.fileModifiedTime,
            fileAccessDate: new Date(),
            imageHeight: metadata.file.imageHeight,
            imageWidth: metadata.file.imageWidth,
            orientation: metadata.file.orientation,
            previewStatus: PreviewStatus.Pending,
          }
        },
        // Create PhotoLocation if GPS data exists
        ...(metadata.gps.gpsLatitude && metadata.gps.gpsLongitude && {
          location: {
            create: {
              latitude: metadata.gps.gpsLatitude,
              longitude: metadata.gps.gpsLongitude,
              altitude: metadata.gps.gpsAltitude,
              timestamp: metadata.gps.gpsTimestamp,
            }
          }
        })
      };

      await this.photoRepository.create(photo);

      // Queue preview generation
      const processorPool = await this.lazyProcessorPool.getPool();
      const previewPath = this.getPreviewPath(user, filePath);
      await processorPool.addTask({
        buffer: fileBuffer,
        outputPath: previewPath,
        filePath
      });

      this.logger.debug(`Processed new file: ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to process new file ${filePath}:`, error);
      throw new PhotoBlogError(`Failed to process new file ${filePath}`, 500);
    }
  }

  /**
   * Process a changed file: extract metadata, update database records, queue preview
   */
  async processChangedFile(
    user: ValidatedUserForScan,
    photoFile: PhotoFileForScan,
    fileBuffer: Buffer,
    fullPath: string,
    fileHash: string
  ): Promise<void> {
    try {
      // Extract all metadata in one call
      const metadata = await this.metadataService.extractMetadata(fullPath);

      // Update photo metadata if this is the source file
      if (photoFile.status === PhotoFileStatus.Source) {
        const photo = await this.photoRepository.findById(photoFile.photoId);
        if (photo) {
          Object.assign(photo, {
            title: path.basename(photoFile.filePath),
            ...metadata.photo
          });
          await this.photoRepository.update(photo);

          // Update or create PhotoLocation if GPS data exists
          if (metadata.gps.gpsLatitude && metadata.gps.gpsLongitude) {
            await this.photoLocationRepository.upsert(
              photoFile.photoId,
              {
                photo: { connect: { id: photoFile.photoId } },
                latitude: metadata.gps.gpsLatitude,
                longitude: metadata.gps.gpsLongitude,
                altitude: metadata.gps.gpsAltitude,
                timestamp: metadata.gps.gpsTimestamp,
              },
              {
                latitude: metadata.gps.gpsLatitude,
                longitude: metadata.gps.gpsLongitude,
                altitude: metadata.gps.gpsAltitude,
                timestamp: metadata.gps.gpsTimestamp,
              }
            );
          }
        }
      }

      // Fetch the full PhotoFile to ensure we have all required fields
      const existingPhotoFile = await this.photoFileRepository.findById(photoFile.id);
      if (!existingPhotoFile) {
        throw new PhotoBlogError(`PhotoFile not found: ${photoFile.id}`, 404);
      }

      // Update photo file
      Object.assign(existingPhotoFile, {
        fileName: path.basename(photoFile.filePath),
        fileType: photoFile.filePath.split('.').pop() || '',
        fileHash: fileHash,
        fileSize: metadata.file.fileSize,
        fileModifiedTime: metadata.file.fileModifiedTime,
        fileAccessDate: new Date(),
        imageHeight: metadata.file.imageHeight,
        imageWidth: metadata.file.imageWidth,
        orientation: metadata.file.orientation,
      });

      await this.photoFileRepository.update(existingPhotoFile);

      // Queue preview regeneration
      const processorPool = await this.lazyProcessorPool.getPool();
      const previewPath = this.getPreviewPath(user, photoFile.filePath);
      await processorPool.addTask({
        buffer: fileBuffer,
        outputPath: previewPath,
        filePath: photoFile.filePath
      });

      this.logger.debug(`Processed changed file: ${photoFile.filePath}`);
    } catch (error) {
      this.logger.error(`Failed to process changed file ${photoFile.filePath}:`, error);
      throw new PhotoBlogError(`Failed to process changed file ${photoFile.filePath}`, 500);
    }
  }

  /**
   * Calculate preview path based on file path hash
   */
  private getPreviewPath(user: ValidatedUserForScan, filePath: string): string {
    const fileHash = crypto.createHash('md5').update(filePath).digest('hex');
    const hashPrefix = fileHash.substring(0, 2);
    return path.join(user.localUser.cachePath, 'previews', hashPrefix, `${fileHash}.webp`);
  }
}
