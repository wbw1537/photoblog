import { PhotoFile, PreviewStatus, PrismaClient } from "@prisma/client";

export class PhotoFileRepository {
  constructor(
    private prismaClient: PrismaClient
  ) {
  }

  async findById(id: string) {
    return await this.prismaClient.photoFile.findUnique({
      where: {
        id,
      },
      include: {
        photo: true,
      }
    });
  }

  async getFileMapByUserId(userId: string): Promise<Map<string, PhotoFile>> {
    const files = await this.prismaClient.photoFile.findMany({
      where: {
        photo: {
          userId
        }
      },
    });

    const fileMap = new Map<string, PhotoFile>();
    files.forEach(file => {
      fileMap.set(file.filePath, file);
    });

    return fileMap;
  }

  async countFilesByPhotoId(photoId: string): Promise<number> {
    return await this.prismaClient.photoFile.count({
      where: {
        photoId,
      }
    });
  }

  async update(photoFile: PhotoFile) {
    return await this.prismaClient.photoFile.update({
      where: {
        id: photoFile.id,
      },
      data: photoFile,
    });
  }

  async updateFilePathById(id: string, filePath: string) {
    return await this.prismaClient.photoFile.update({
      where: {
        id,
      },
      data: { filePath },
    });
  }

  async delete(id: string) {
    return await this.prismaClient.photoFile.delete({
      where: {
        id,
      },
    });
  }

  async updatePreviewStatusReady(filePath: string, previewPath: string): Promise<void> {
    await this.prismaClient.photoFile.update({
      where: { filePath },
      data: {
        previewStatus: PreviewStatus.Ready,
        previewPath,
        previewError: null,
      },
    });
  }

  async updatePreviewStatusFailed(filePath: string, error: string): Promise<void> {
    await this.prismaClient.photoFile.update({
      where: { filePath },
      data: {
        previewStatus: PreviewStatus.Failed,
        previewError: error,
      },
    });
  }

  async updatePreviewStatusProcessing(filePath: string): Promise<void> {
    await this.prismaClient.photoFile.update({
      where: { filePath },
      data: {
        previewStatus: PreviewStatus.Processing,
      },
    });
  }
}