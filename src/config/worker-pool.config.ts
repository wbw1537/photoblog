import os from 'os';

export interface WorkerPoolConfig {
  workerCount: number;
  maxQueueSizeMB: number;
}

export function getWorkerPoolConfig(): WorkerPoolConfig {
  // Docker-aware worker count configuration
  const envWorkerCount = process.env.PHOTO_WORKER_COUNT;
  const cpuCount = os.cpus().length;

  let workerCount: number;

  if (envWorkerCount) {
    // Use environment variable if set (for Docker deployment)
    workerCount = parseInt(envWorkerCount, 10);
    if (isNaN(workerCount) || workerCount < 1) {
      workerCount = Math.max(2, cpuCount - 1);
    }
  } else {
    // Auto-detect: leave 1 core for I/O and main process
    workerCount = Math.max(2, cpuCount - 1);
  }

  // Memory pool size from env or default 512MB
  const maxQueueSizeMB = parseInt(process.env.PHOTO_WORKER_MEMORY_MB || '512', 10);

  return {
    workerCount,
    maxQueueSizeMB
  };
}
