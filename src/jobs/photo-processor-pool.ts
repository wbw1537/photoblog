import { Worker } from 'worker_threads';
import { EventEmitter } from 'events';
import path from 'path';
import { fileURLToPath } from 'url';
import { Logger } from 'log4js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ProcessTask {
  buffer: Buffer;
  outputPath: string;
  filePath: string;
}

interface ProcessResult {
  success: boolean;
  filePath: string;
  error?: string;
}

export class PhotoProcessorPool {
  private workers: Worker[] = [];
  private queue: ProcessTask[] = [];
  private activeWorkers = 0;
  private maxQueueSize: number;
  private emitter = new EventEmitter();
  private completedTasks = 0;
  private failedTasks = 0;

  constructor(
    private workerCount: number,
    maxQueueSizeMB: number,
    private logger: Logger
  ) {
    this.maxQueueSize = maxQueueSizeMB * 1024 * 1024;
    this.initWorkers();
  }

  private initWorkers() {
    const workerPath = path.join(__dirname, '../workers/photo-processor.worker.js');

    for (let i = 0; i < this.workerCount; i++) {
      try {
        const worker = new Worker(workerPath);

        worker.on('message', (result: ProcessResult) => {
          this.activeWorkers--;

          if (result.success) {
            this.completedTasks++;
            this.logger.debug(`Worker completed: ${result.filePath}`);
          } else {
            this.failedTasks++;
            this.logger.error(`Worker failed: ${result.filePath} - ${result.error}`);
          }

          this.emitter.emit('taskComplete', result);
          this.processNext();
        });

        worker.on('error', (error) => {
          this.logger.error(`Worker error:`, error);
          this.activeWorkers--;
          this.failedTasks++;
          this.processNext();
        });

        worker.on('exit', (code) => {
          if (code !== 0) {
            this.logger.error(`Worker stopped with exit code ${code}`);
          }
        });

        this.workers.push(worker);
      } catch (error) {
        this.logger.error(`Failed to create worker ${i}:`, error);
      }
    }

    this.logger.info(`Initialized ${this.workers.length} worker threads for photo processing`);
  }

  async addTask(task: ProcessTask): Promise<void> {
    // Backpressure control: wait if queue is too large
    while (this.getQueueSize() > this.maxQueueSize) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.queue.push(task);
    this.processNext();
  }

  private processNext() {
    // Process multiple tasks if workers are available
    while (this.queue.length > 0 && this.activeWorkers < this.workers.length) {
      const task = this.queue.shift();
      if (!task) break;

      const availableWorkerIndex = this.activeWorkers;
      const worker = this.workers[availableWorkerIndex];

      if (worker) {
        this.activeWorkers++;
        worker.postMessage(task);
      }
    }
  }

  private getQueueSize(): number {
    return this.queue.reduce((sum, task) => sum + task.buffer.length, 0);
  }

  async waitForCompletion(): Promise<void> {
    while (this.queue.length > 0 || this.activeWorkers > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.logger.info(
      `Photo processing completed - Success: ${this.completedTasks}, Failed: ${this.failedTasks}`
    );
  }

  getStats() {
    return {
      completed: this.completedTasks,
      failed: this.failedTasks,
      queued: this.queue.length,
      active: this.activeWorkers
    };
  }

  async terminate() {
    this.logger.info('Terminating worker pool...');
    await Promise.all(this.workers.map(w => w.terminate()));
    this.workers = [];
  }
}
