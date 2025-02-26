import { NextFunction, Request, Response } from "express";
import { BlogType } from "@prisma/client";

import { BlogService } from "../services/blog.service.js";
import { BlogRequest, CreateBlogDTO } from "../models/blog.model.js";

export class BlogController {
  constructor(
    private blogService: BlogService
  ) {}

  async getBlogs(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.body.user.id;
      const blogRequest: BlogRequest = {
        title: req.query.title as string || undefined,
        blogType: req.query.blogType as BlogType || undefined,
        tags: req.query.tags ? (req.query.tags as string).split(',') : [],
        skip: parseInt(req.query.skip as string, 10) || 0,
        take: parseInt(req.query.take as string, 10) || 10
      }
      const blogs = await this.blogService.getBlogs(userId, blogRequest);
      res.status(200).json(blogs);
    } catch (error: unknown) {
      next(error);
    }
  }

  async getBlogById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.body.user.id;
      const blogId = req.params.blogId;
      const blog = await this.blogService.getBlogById(userId, blogId);
      res.status(200).json(blog);
    } catch (error: unknown) {
      next(error);
    }
  }

  async postBlog(req: Request, res: Response, next: NextFunction) {
    try {
      const blogCreateInput: CreateBlogDTO = req.body.blog;
      const userId = req.body.user.id;
      const respond = await this.blogService.postBlog(userId, blogCreateInput);
      res.status(201).json(respond);
    } catch (error: unknown) {
      next(error);
    }
  }
}
