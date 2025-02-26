import { Prisma, PrismaClient } from "@prisma/client";

export class BlogRepository {
  constructor(
    private prismaClient: PrismaClient
  ) {
  }

  async findById(id: string) {
    return await this.prismaClient.blog.findUnique({
      where: {
        id,
        isDeleted: false
      },
      select: {
        ...this.buildBlogSelect()
      }
    });
  }

  async findAllByFilter(skip: number, take: number, filter: Prisma.BlogWhereInput) {
    const [blogs, total] = await this.prismaClient.$transaction([
      this.prismaClient.blog.findMany({
        take,
        skip,
        where: {
          AND: [
            filter,
          ],
        },
        select: {
          content: true,
          ...this.buildBlogSelect()
        },
      }),
      this.prismaClient.blog.count({
        where: {
          AND: [
            filter,
          ],
        }
      })
    ]);

    return {
      data: blogs,
      pagination: {
        skip,
        take,
        total
      }
    }
  }

  async createBlog(blog: Prisma.BlogCreateInput) {
    return await this.prismaClient.blog.create({
      data: blog
    });
  }

  private buildBlogSelect() {
    return {
      id: true,
      userId: true,
      title: true,
      blogType: true,
      tags: {
        select: {
          tag: {
            select: {
              name: true
            }
          }
        }
      },
      blogMedia: {
        select: {
          id: true,
          mediaType: true,
          mediaId: true,
          mediaPosition: true
        }
      }
    }
  }
}
