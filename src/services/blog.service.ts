import { BlogType, MediaType, Prisma } from "@prisma/client";

import { CreateBlogDTO } from "../models/blog.model.js";
import { BlogRepository } from "../repositories/blog.repository.js";

export class BlogService {
  constructor(
    private blogRepository: BlogRepository
  ) {}

  async postBlog(userId: string, blogCreateInput: CreateBlogDTO) {
    const createInput = this.convertCreateInput(userId, blogCreateInput);
    return await this.blogRepository.createBlog(createInput);
  }

  private convertCreateInput(userId: string, blogCreateInput: CreateBlogDTO): Prisma.BlogCreateInput {
    console.log(blogCreateInput);
    // Check if the blogType instance of BlogType
    const blogType = blogCreateInput.blogType;
    if (!(blogType in BlogType)) {
      throw new Error("Invalid blog type");
    } else {
      blogCreateInput.blogType = blogType;
    }
    // Check if the blogMediaType instance of MediaType
    const blogMedia = blogCreateInput.blogMedia;
    blogMedia.forEach((media) => {
      if (!(media.mediaType in MediaType)) {
        throw new Error("Invalid media type");
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
