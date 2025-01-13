export class PhotoFile {
  id: string;
  photoId: string;
  fileName: string;
  fileType: string;
  filePath: string;
  fileSize: number;
  fileModifiedTime?: Date;
  fileAccessDate?: Date;
  status: PhotoFileStatus;
  imageHeight: number;
  imageWidth: number;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;

  constructor(
    id: string,
    photoId: string,
    fileName: string,
    fileType: string,
    filePath: string,
    fileSize: number,
    fileModifiedTime: Date | undefined,
    fileAccessDate: Date | undefined,
    status: PhotoFileStatus,
    imageHeight: number,
    imageWidth: number,
    createdAt: Date,
    updatedAt: Date,
    isDeleted: boolean
  ) {
    this.id = id;
    this.photoId = photoId;
    this.fileName = fileName;
    this.fileType = fileType;
    this.filePath = filePath;
    this.fileSize = fileSize;
    this.fileModifiedTime = fileModifiedTime;
    this.fileAccessDate = fileAccessDate;
    this.status = status;
    this.imageHeight = imageHeight;
    this.imageWidth = imageWidth;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.isDeleted = isDeleted;
  }
}

export enum PhotoFileStatus {
  Main = "Main",
  Sub = "Sub"
}
