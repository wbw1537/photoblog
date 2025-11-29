import { Logger } from 'log4js';
import { PhotoProcessorPool } from './photo-processor-pool.js';
import { PhotoFileRepository } from '../repositories/photo-file.repository.js';
import { getWorkerPoolConfig } from '../config/worker-pool.config.js';

/**
 * Lazy-initialized singleton wrapper for PhotoProcessorPool
 * Creates worker pool on first use, terminates after idle timeout
 * Perfect for photo scans that happen rarely (1/100 of usage time)
 */
export class LazyPhotoProcessorPool {
  private pool: PhotoProcessorPool | null = null;
  private idleTimer: NodeJS.Timeout | null = null;
  private readonly IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

  constructor(
    private photoFileRepository: PhotoFileRepository,
    private logger: Logger
  ) {}

  async getPool(): Promise<PhotoProcessorPool> {
    // Clear idle timer if exists
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }

    // Create pool if it doesn't exist
    if (!this.pool) {
      this.logger.info('Lazy-initializing photo processor pool...');
      const config = getWorkerPoolConfig();
      this.pool = new PhotoProcessorPool(
        config.workerCount,
        config.maxQueueSizeMB,
        this.photoFileRepository,
        this.logger
      );
    }

    return this.pool;
  }

  async releasePool(): Promise<void> {
    // Start idle timer to terminate pool after timeout
    if (this.pool && !this.idleTimer) {
      this.logger.debug(`Starting idle timer for worker pool (${this.IDLE_TIMEOUT_MS}ms)`);

      this.idleTimer = setTimeout(async () => {
        if (this.pool) {
          this.logger.info('Worker pool idle timeout reached, terminating...');
          await this.pool.terminate();
          this.pool = null;
          this.idleTimer = null;
        }
      }, this.IDLE_TIMEOUT_MS);
    }
  }

  async forceTerminate(): Promise<void> {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }

    if (this.pool) {
      this.logger.info('Force terminating worker pool...');
      await this.pool.terminate();
      this.pool = null;
    }
  }

  isActive(): boolean {
    return this.pool !== null;
  }
}
