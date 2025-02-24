export interface PhotosRequest {
  title?: string;
  liked?: boolean;
  cameraMake?: string;
  cameraModel?: string;
  lensMake?: string;
  lensModel?: string;

  minFocalLength?: number;
  maxFocalLength?: number;

  minFNumber?: number;
  maxFNumber?: number;

  minIso?: number;
  maxIso?: number;

  minExposureTime?: number;
  maxExposureTime?: number;

  dateTakenStart?: Date;
  dateTakenEnd?: Date;

  tags?: string[];

  latitude?: number;
  longitude?: number;
  radius?: number;

  skip: number;
  take: number;
}