import { NextFunction, Request, Response } from "express";

import { BlogService } from "../services/blog.service.js";
import { CreateBlogDTO } from "../models/blog.model.js";

export class BlogController {
  constructor(
    private blogService: BlogService
  ) {}

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
