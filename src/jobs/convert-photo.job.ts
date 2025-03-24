import { Logger } from 'log4js';
import { exec } from 'child_process';
import { User } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export class ConvertPhotoJob {
  constructor(
    private logger: Logger,
  ) { }

  async convertToPreview(user: User, filePath: string) {
    const fileFullPath = path.join(user.basePath, filePath);
    // Create a hash from the filepath to avoid special chars and long paths
    const fileHash = crypto.createHash('md5').update(filePath).digest('hex');
    // Organize by hash prefix (first 2 chars) for better directory distribution
    const hashPrefix = fileHash.substring(0, 2);
    
    // Store previews in a more organized way
    const previewDir = path.join(user.cachePath, 'previews', hashPrefix);
    const previewPhotoFullPath = path.join(previewDir, `${fileHash}.webp`);
    
    try {
      // Ensure the directory exists before writing the file
      await fs.mkdir(previewDir, { recursive: true });
      
      return new Promise<void>((resolve, reject) => {
        exec(`magick "${fileFullPath}" -auto-orient -resize 1200x1200^ "${previewPhotoFullPath}"`, (error, stdout, stderr) => {
          if (error) {
            this.logger.error(`Error converting image: ${error.message}`);
            reject(error);
            return;
          }
          if (stderr) {
            this.logger.warn(`Warning during conversion: ${stderr}`);
          }
          this.logger.info(`Successfully converted ${filePath} to preview`);
          resolve();
        });
      });
    } catch (error) {
      this.logger.error(`Failed to create preview for ${filePath}:`, error);
      throw error;
    }
  }

  async deletePreview(user: User, filePath: string) {
    const fileHash = crypto.createHash('md5').update(filePath).digest('hex');
    const hashPrefix = fileHash.substring(0, 2);
    const previewPhotoFullPath = path.join(user.cachePath, 'previews', hashPrefix, `${fileHash}.webp`);
    
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