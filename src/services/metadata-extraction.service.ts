import { ExifTool, ExifDateTime, Tags } from 'exiftool-vendored';
import { Logger } from 'log4js';
import { PhotoBlogError } from '../errors/photoblog.error.js';

export interface ExtractedPhotoMetadata {
  // Photo metadata
  iso: number | null;
  exposureTime: number | null;
  exposureTimeValue: string | null;
  fNumber: number | null;
  cameraMake: string | null;
  cameraModel: string | null;
  lensMake: string | null;
  lensModel: string | null;
  focalLength: number | null;
  focalLength35mm: number | null;
  dateTaken: Date | null;
  timeZone: string | null;
}

export interface ExtractedFileMetadata {
  // File metadata (from ExifTool)
  fileSize: number;
  fileModifiedTime: Date;
  imageHeight: number;
  imageWidth: number;
  orientation: number;
}

export interface ExtractedGPSMetadata {
  // GPS metadata
  gpsLatitude: number | null;
  gpsLongitude: number | null;
  gpsAltitude: number | null;
  gpsTimestamp: Date | null;
}

export interface ExtractedMetadata {
  photo: ExtractedPhotoMetadata;
  file: ExtractedFileMetadata;
  gps: ExtractedGPSMetadata;
}

/**
 * Service for extracting metadata from photo files using exiftool-vendored
 * Provides accurate dimension extraction for RAW files (CR2, NEF, ARW, etc.)
 */
export class MetadataExtractionService {
  private exiftool: ExifTool;

  constructor(private logger: Logger) {
    this.exiftool = new ExifTool({ taskTimeoutMillis: 30000 });
    this.logger.info('MetadataExtractionService initialized with exiftool-vendored');
  }

  /**
   * Extract all metadata from a single file using exiftool with -fast2 flag
   * This includes photo metadata, file metadata, GPS data, and dimensions
   * @param filePath - Absolute path to the photo file
   * @returns Extracted metadata (photo, file, gps)
   */
  async extractMetadata(filePath: string): Promise<ExtractedMetadata> {
    try {
      // Use exiftool with -fast2 flag (reads headers only, not full file)
      const tags = await this.exiftool.read(filePath, { readArgs: ['-fast2'] });

      return {
        photo: this.extractPhotoMetadata(tags),
        file: this.extractFileMetadata(tags),
        gps: this.extractGPSMetadata(tags),
      };
    } catch (error) {
      this.logger.error(`Failed to extract metadata from ${filePath}:`, error);
      throw new PhotoBlogError(`Failed to extract metadata from ${filePath}`, 500);
    }
  }

  private extractPhotoMetadata(tags: Tags): ExtractedPhotoMetadata {
    return {
      iso: tags.ISO || null,
      exposureTime: this.convertExposureTime(tags.ExposureTime?.toString()),
      exposureTimeValue: tags.ExposureTime?.toString() || null,
      fNumber: tags.FNumber || null,
      cameraMake: tags.Make || null,
      cameraModel: tags.Model || null,
      lensMake: tags.LensMake || null,
      lensModel: tags.LensModel || null,
      focalLength: tags.FocalLength ? Number(tags.FocalLength.toString().split(' ')[0]) : null,
      focalLength35mm: tags.FocalLengthIn35mmFormat ? Number(tags.FocalLengthIn35mmFormat.toString().split(' ')[0]) : null,
      dateTaken: tags.DateTimeOriginal instanceof ExifDateTime
        ? tags.DateTimeOriginal.toDate()
        : null,
      timeZone: tags.TimeZone || null,
    };
  }

  private extractFileMetadata(tags: Tags): ExtractedFileMetadata {
    // Priority order for dimensions (RAW files):
    // 1. ImageWidth/ImageHeight (from SubIFD - sensor data)
    // 2. ExifImageWidth/ExifImageHeight (fallback)
    const width = tags.ImageWidth || tags.ExifImageWidth || 0;
    const height = tags.ImageHeight || tags.ExifImageHeight || 0;

    return {
      fileSize: tags.FileSize ? parseInt(tags.FileSize.toString(), 10) : 0,
      fileModifiedTime: tags.FileModifyDate instanceof ExifDateTime
        ? tags.FileModifyDate.toDate()
        : new Date(tags.FileModifyDate?.toString() || Date.now()),
      imageHeight: height,
      imageWidth: width,
      orientation: tags.Orientation || 1, // Default to 1 (normal)
    };
  }

  private extractGPSMetadata(tags: Tags): ExtractedGPSMetadata {
    return {
      gpsLatitude: tags.GPSLatitude ? Number(tags.GPSLatitude) : null,
      gpsLongitude: tags.GPSLongitude ? Number(tags.GPSLongitude) : null,
      gpsAltitude: tags.GPSAltitude ? Number(tags.GPSAltitude) : null,
      gpsTimestamp: tags.GPSTimeStamp instanceof ExifDateTime
        ? tags.GPSTimeStamp.toDate()
        : null,
    };
  }

  /**
   * Convert exposure time string to numeric value
   * Examples: "1/125" -> 0.008, "2.5" -> 2.5
   */
  private convertExposureTime(exposureTimeStr: string | undefined): number | null {
    if (!exposureTimeStr) return null;

    try {
      // Handle fraction format "1/125"
      if (exposureTimeStr.includes('/')) {
        const [numerator, denominator] = exposureTimeStr.split('/').map(Number);
        return numerator / denominator;
      }

      // Handle decimal format "2.5"
      const value = Number(exposureTimeStr);
      return isNaN(value) ? null : value;
    } catch (error) {
      this.logger.warn(`Failed to convert exposure time: ${exposureTimeStr}`);
      return null;
    }
  }

  /**
   * Cleanup and close the exiftool process
   * Should be called when the service is no longer needed
   */
  async close(): Promise<void> {
    try {
      await this.exiftool.end();
      this.logger.info('MetadataExtractionService closed');
    } catch (error) {
      this.logger.error('Failed to close exiftool:', error);
    }
  }
}
