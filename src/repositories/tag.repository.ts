import { PrismaClient } from "@prisma/client";

export class TagRepository {
  constructor(
    private prismaClient: PrismaClient
  ) {
  }

  async createTag(tags: string[]) {
    return await this.prismaClient.tag.createMany({
      data: tags.map(tag => ({ name: tag })),
      skipDuplicates: true,
    });
  }

  async findTagIds(tags: string[]): Promise<string[]> {
    const tagIds = await this.prismaClient.tag.findMany({
      where: { name: { in: tags } },
      select: { id: true },
    });
    return tagIds.map(tag => tag.id);
  }

  async createPhotoTag(photoId: string, tags: string[]) {
    await this.createTag(tags);
    const createdTags = await this.prismaClient.tag.findMany({
      where: { name: { in: tags } }
    });
    return await this.prismaClient.photoTag.createMany({
      data: createdTags.map(tag => ({ photoId, tagId: tag.id })),
      skipDuplicates: true,
    });
  }

  async findPhotoTags(photoId: string) {
    return await this.prismaClient.photoTag.findMany({
      where: { photoId },
      include: { tag: true },
    });
  }

  async updatePhotoTags(photoId: string, tags: string[]) {
    return await this.prismaClient.$transaction(async () => {
      await this.prismaClient.photoTag.deleteMany({
        where: { photoId },
      });
      return await this.createPhotoTag(photoId, tags);
    });
  }

  async deletePhotoTags(photoId: string, tagIds: string[]) {
    return await this.prismaClient.photoTag.deleteMany({
      where: {
        photoId,
        tagId: { in: tagIds },
      },
    });
  }

  async createBlogTag(blogId: string, tags: string[]) {
    await this.createTag(tags);
    const createdTags = await this.prismaClient.tag.findMany({
      where: { name: { in: tags } }
    });
    return await this.prismaClient.blogTag.createMany({
      data: createdTags.map(tag => ({ blogId, tagId: tag.id })),
      skipDuplicates: true,
    });
  }

  async findBlogTags(blogId: string) {
    return await this.prismaClient.blogTag.findMany({
      where: { blogId },
      include: { tag: true },
    });
  }

  async updateBlogTags(blogId: string, tags: string[]) {
    return await this.prismaClient.$transaction(async () => {
      await this.prismaClient.blogTag.deleteMany({
        where: { blogId },
      });
      return await this.createBlogTag(blogId, tags);
    });
  }

  async deleteBlogTags(blogId: string, tagIds: string[]) {
    return await this.prismaClient.blogTag.deleteMany({
      where: {
        blogId,
        tagId: { in: tagIds },
      },
    });
  }
}