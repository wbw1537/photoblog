import { PhotoFile } from './photoFile.model';

export class Photo {
  id: string;
  userId: string;
  title: string;
  description?: string;
  liked: boolean;
  iso?: number;
  exposureTime?: string;
  fNumber?: number;
  cameraMake?: string;
  cameraModel?: string;
  lensMake?: string;
  lensModel?: string;
  focalLength?: number;
  focalLength35mm?: number;
  dateTaken?: Date;
  timeZone?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  gpsTimestamp?: Date;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  files: PhotoFile[];

  constructor(
    id: string,
    userId: string,
    title: string,
    description: string | undefined,
    liked: boolean,
    iso: number | undefined,
    exposureTime: string | undefined,
    fNumber: number | undefined,
    cameraMake: string | undefined,
    cameraModel: string | undefined,
    lensMake: string | undefined,
    lensModel: string | undefined,
    focalLength: number | undefined,
    focalLength35mm: number | undefined,
    dateTaken: Date | undefined,
    timeZone: string | undefined,
    gpsLatitude: number | undefined,
    gpsLongitude: number | undefined,
    gpsTimestamp: Date | undefined,
    createdAt: Date,
    updatedAt: Date,
    isDeleted: boolean,
    files: PhotoFile[]
  ) {
    this.id = id;
    this.userId = userId;
    this.title = title;
    this.description = description;
    this.liked = liked;
    this.iso = iso;
    this.exposureTime = exposureTime;
    this.fNumber = fNumber;
    this.cameraMake = cameraMake;
    this.cameraModel = cameraModel;
    this.lensMake = lensMake;
    this.lensModel = lensModel;
    this.focalLength = focalLength;
    this.focalLength35mm = focalLength35mm;
    this.dateTaken = dateTaken;
    this.timeZone = timeZone;
    this.gpsLatitude = gpsLatitude;
    this.gpsLongitude = gpsLongitude;
    this.gpsTimestamp = gpsTimestamp;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.isDeleted = isDeleted;
    this.files = files;
  }
}
