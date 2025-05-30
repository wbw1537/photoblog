import { PhotoBlogError } from "../errors/photoblog.error";

export enum JobStatusType {
  INITIALIZING = 'initializing',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ERROR = 'error',
}

export enum UpdateJobStatusType {
  INCREASED_SCANNED = 'increased_scanned',
  NOT_MATCHED_MATCHED_WITH_INCREASED = 'not_matched_matched_with_increased',
  NOT_MATCHED_DELETED = 'not_matched_deleted',
  MATCHED_UPDATED = 'matched_updated',
}

export interface ScanStatus {
  jobId: string;
  status: JobStatusType;
  photosIncreased: number;
  photosIncreasedScanned: number;
  photosNotMatched: number;
  photosNotMatchedMatchedWithIncrease: number;
  photosNotMatchedDeleted: number;
  photosMatched: number;
  photosMatchedUpdated: number;
}

export class ScanStatusService {
  private scanStatus = new Map<string, ScanStatus>();

  initializeScanJob(userId: string, jobId: string): void {
    this.scanStatus.set(userId, {
      jobId,
      status: JobStatusType.INITIALIZING,
      photosIncreased: 0,
      photosIncreasedScanned: 0,
      photosNotMatched: 0,
      photosNotMatchedMatchedWithIncrease: 0,
      photosNotMatchedDeleted: 0,
      photosMatched: 0,
      photosMatchedUpdated: 0,
    });
  }

  setScanJobInProgress(userId: string, photosIncreased: number, photosNotMatched: number, photosMatched: number): void {
    const status = this.scanStatus.get(userId);
    if (!status) {
      throw new PhotoBlogError('Job not found', 404);
    }
    status.status = JobStatusType.IN_PROGRESS;
    status.photosIncreased = photosIncreased;
    status.photosNotMatched = photosNotMatched;
    status.photosMatched = photosMatched;
  }

  updateInProgressScanJob(userId: string, updateJobStatusType: UpdateJobStatusType): void {
    const status = this.scanStatus.get(userId);
    if (!status) {
      throw new PhotoBlogError('Job not found', 404);
    }
    switch (updateJobStatusType) {
      case UpdateJobStatusType.INCREASED_SCANNED:
        status.photosIncreasedScanned += 1;
        break;
      case UpdateJobStatusType.NOT_MATCHED_MATCHED_WITH_INCREASED:
        status.photosNotMatchedMatchedWithIncrease += 1;
        break;
      case UpdateJobStatusType.NOT_MATCHED_DELETED:
        status.photosNotMatchedDeleted += 1;
        break;
      case UpdateJobStatusType.MATCHED_UPDATED:
        status.photosMatchedUpdated += 1;
        break;
    }
  }

  setScanJobError(userId: string): void {
    const status = this.scanStatus.get(userId);
    // If the status is not found, it means the job has not been initialized yet
    if (status) {
      status.status = JobStatusType.ERROR;
    }
  }

  completeScanJob(userId: string): void {
    const status = this.scanStatus.get(userId);
    if (!status) {
      throw new PhotoBlogError('Job not found', 404);
    }
    status.status = JobStatusType.COMPLETED;
  }

  getScanStatus(userId: string): ScanStatus | undefined {
    return this.scanStatus.get(userId);
  }

  deleteJobStatus(userId: string): void {
    this.scanStatus.delete(userId);
  }
}