import { parentPort } from 'worker_threads';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

interface ProcessTask {
  buffer: Buffer;
  outputPath: string;
  filePath: string;
}

interface ProcessResult {
  success: boolean;
  filePath: string;
  outputPath?: string;
  error?: string;
}

if (!parentPort) {
  throw new Error('This file must be run as a Worker thread');
}

parentPort.on('message', async (task: ProcessTask) => {
  try {
    // Ensure output directory exists
    const outputDir = path.dirname(task.outputPath);
    await fs.mkdir(outputDir, { recursive: true });

    // Process image with Sharp
    await sharp(task.buffer)
      .rotate() // Auto-orient based on EXIF
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(task.outputPath);

    const result: ProcessResult = {
      success: true,
      filePath: task.filePath,
      outputPath: task.outputPath
    };

    parentPort?.postMessage(result);
  } catch (error) {
    const result: ProcessResult = {
      success: false,
      filePath: task.filePath,
      error: error instanceof Error ? error.message : String(error)
    };

    parentPort?.postMessage(result);
  }
});
