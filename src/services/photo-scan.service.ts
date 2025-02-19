import { v4 as uuidv4 } from 'uuid';

import { JobStatusType, ScanStatusService } from "./scan-status.service.js";
import { PhotoScanJob } from "../jobs/photo-scan.job.js";

import { PhotoBlogError } from '../errors/photoblog.error.js';

export class PhotoScanService {
  constructor(
    private scanStatusService: ScanStatusService,
    private photoScanJob: PhotoScanJob
  ) {
  }

  async scan(userId: string): Promise<string> {
    const jobId = this.checkJobStatus(userId);
    this.photoScanJob.startPhotoScanJob(userId, jobId, false);
    return jobId;
  }

  async deltaScan(userId: string): Promise<string> {
    const jobId = this.checkJobStatus(userId);
    this.photoScanJob.startPhotoScanJob(userId, jobId);
    return jobId;
  }

  private checkJobStatus(userId: string): string {
    const scanJob = this.scanStatusService.getScanStatus(userId);
    if (scanJob && scanJob.status !== JobStatusType.COMPLETED) {
      throw new PhotoBlogError('Scan job already in progress', 409);
    }
    return uuidv4();
  }
}