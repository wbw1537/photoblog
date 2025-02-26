import { BlogType, MediaType, Prisma } from "@prisma/client";

import { BlogRequest, CreateBlogDTO } from "../models/blog.model.js";

import { BlogRepository } from "../repositories/blog.repository.js";
import { TagRepository } from "../repositories/tag.repository.js";

import { PhotoBlogError } from "../errors/photoblog.error.js";

export class BlogService {
  constructor(
    private blogRepository: BlogRepository,
    private tagRepository: TagRepository
  ) {}

  async getBlogs(userId: string, blogRequest: BlogRequest) {
    const tagIds = blogRequest.tags ? await this.tagRepository.findTagIds(blogRequest.tags) : [];
    const whereInput = this.buildWhereInput(userId, tagIds, blogRequest);
    return await this.blogRepository.findAllByFilter(blogRequest.skip, blogRequest.take, whereInput);
  }

  private buildWhereInput(userId: string, tagIds: string[] , blogRequest: BlogRequest) {
    const {
      title,
      blogType
    } = blogRequest;
    const whereInput: Prisma.BlogWhereInput = {
      userId,
      isDeleted: false,
      title: title ? { contains: title } : undefined,
      blogType: blogType || undefined,
      tags: tagIds.length > 0 ? { some: { tagId: { in: tagIds } } } : undefined,
    }

    // Remove any undefined properties in whereInput to avoid issues with Prisma queries
    Object.keys(whereInput).forEach(
      (key) => (whereInput as never)[key] === undefined && delete (whereInput as never)[key]
    );
    return whereInput;
  }

  async getBlogById(userId: string, blogId: string) {
    const blog = await this.blogRepository.findById(blogId);
    if (!blog) {
      throw new PhotoBlogError("Blog not found", 404);
    } else if (blog.userId !== userId) {
      throw new PhotoBlogError("Unauthorized", 403);
    }
    return { data: blog };
  }

  async postBlog(userId: string, blogCreateInput: CreateBlogDTO) {
    const createInput = this.convertCreateInput(userId, blogCreateInput);
    return await this.blogRepository.createBlog(createInput);
  }

  private convertCreateInput(userId: string, blogCreateInput: CreateBlogDTO): Prisma.BlogCreateInput {
    console.log(blogCreateInput);
    // Check if the blogType instance of BlogType
    const blogType = blogCreateInput.blogType;
    if (!(blogType in BlogType)) {
      throw new PhotoBlogError("Invalid blog type", 400);
    } else {
      blogCreateInput.blogType = blogType;
    }
    // Check if the blogMediaType instance of MediaType
    const blogMedia = blogCreateInput.blogMedia;
    blogMedia.forEach((media) => {
      if (!(media.mediaType in MediaType)) {
        throw new PhotoBlogError("Invalid media type", 400);
      }
    });
    return {
      title: blogCreateInput.title,
      content: blogCreateInput.content,
      blogType: blogCreateInput.blogType as BlogType,
      blogMedia: {
        create: blogCreateInput.blogMedia.map((media) => ({
          mediaType: media.mediaType as MediaType,
          mediaId: media.mediaId,
          mediaPosition: media.mediaPosition,
        })),
      },
      user: {
        connect: {
          id: userId,
        },
      }
    };
  }
}
