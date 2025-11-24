import { BlogType } from "@prisma/client";

export interface CreateBlogDTO {
  title: string;
  content: string;
  blogType: string;
  blogMedia: {
    mediaType: string;
    mediaId: string;
    mediaPosition: number;
  }[];
}

export interface BlogRequest {
  title?: string;
  blogType?: BlogType;
  tags?: string[];
  skip: number;
  take: number;
}
