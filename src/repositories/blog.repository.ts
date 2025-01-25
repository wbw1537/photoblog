import { Prisma, PrismaClient } from "@prisma/client";

export class BlogRepository {
  constructor(
    private prismaClient: PrismaClient
  ) {
  }

  async createBlog(blog: Prisma.BlogCreateInput) {
    return await this.prismaClient.blog.create({
      data: blog
    });
  }
}
