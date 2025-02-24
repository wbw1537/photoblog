import { TagRepository } from "../repositories/tag.repository.js";
import { CreateTagDTO } from "../models/tag.model.js";
import { PhotoRepository } from "../repositories/photo.repository.js";
import { BlogRepository } from "../repositories/blog.repository.js";

import { PhotoBlogError } from "../errors/photoblog.error.js";

export class TagService {
  constructor(
    private tagRepository: TagRepository,
    private photoRepository: PhotoRepository,
    private blogRepository: BlogRepository
  ) { }

  private async validateResourceOwnership(
    userId: string,
    resourceType: string,
    resourceId: string
  ): Promise<void> {
    switch (resourceType) {
      case "photo": {
        const photo = await this.photoRepository.findByIdAndUserId(resourceId, userId);
        if (!photo) {
          throw new PhotoBlogError("Photo not found", 404);
        }
        break;
      }

      case "blog": {
        const blog = await this.blogRepository.findByIdAndUserId(resourceId, userId);
        if (!blog) {
          throw new PhotoBlogError("Blog not found", 404);
        }
        break;
      }
      default:
        throw new PhotoBlogError("Invalid resource type", 400);
    }
  }

  async addTag(userId: string, tagCreateInput: CreateTagDTO) {
    const { tags, resourceType, resourceId } = tagCreateInput;

    await this.validateResourceOwnership(userId, resourceType, resourceId);

    switch (resourceType) {
      case "photo":
        return await this.tagRepository.createPhotoTag(resourceId, tags);
      case "blog":
        return await this.tagRepository.createBlogTag(resourceId, tags);
    }
  }

  async updateTag(userId: string, tagCreateInput: CreateTagDTO) {
    const { tags, resourceType, resourceId } = tagCreateInput;

    await this.validateResourceOwnership(userId, resourceType, resourceId);

    switch (resourceType) {
      case "photo":
        return await this.tagRepository.updatePhotoTags(resourceId, tags);
      case "blog":
        return await this.tagRepository.updateBlogTags(resourceId, tags);
    }
  }

  async deleteTag(userId: string, tagCreateInput: CreateTagDTO) {
    const { tags, resourceType, resourceId } = tagCreateInput;
    await this.validateResourceOwnership(userId, resourceType, resourceId);

    const tagIdsToDelete = await this.tagRepository.findTagIds(tags);

    switch (resourceType) {
      case "photo":
        return await this.tagRepository.deletePhotoTags(resourceId, tagIdsToDelete);
      case "blog":
        return await this.tagRepository.deleteBlogTags(resourceId, tagIdsToDelete);
    }
  }
}