import { PhotoFileStatus } from "@prisma/client";

export enum FileResolution {
  ORIGINAL = "original",
  COMPRESSED_4K = "4k",
  COMPRESSED_1080p = "1080p",
  PREVIEW = "preview"
}

export interface PhotoFileForScan {
  id: string;
  filePath: string;
  fileHash: string;
  photoId: string;
  status: PhotoFileStatus;
}