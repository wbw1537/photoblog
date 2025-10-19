import express, { NextFunction, Request, Response, RequestHandler } from 'express';
import { BlogType } from "@prisma/client";
import { BlogService } from "../services/blog.service.js";
import { BlogRequest, CreateBlogDTO } from "../models/blog.model.js";

export function createBlogRouter(
  blogService: BlogService,
  authenticate: RequestHandler
) {
  const blogRouter = express.Router();

  blogRouter.get('/v1/blogs', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.body.user.id;
      const blogRequest: BlogRequest = {
        title: req.query.title as string || undefined,
        blogType: req.query.blogType as BlogType || undefined,
        tags: req.query.tags ? (req.query.tags as string).split(',') : [],
        skip: parseInt(req.query.skip as string, 10) || 0,
        take: parseInt(req.query.take as string, 10) || 10
      }
      const blogs = await blogService.getBlogs(userId, blogRequest);
      res.status(200).json(blogs);
    } catch (error: unknown) {
      next(error);
    }
  });

  blogRouter.get('/v1/blogs/:blogId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.body.user.id;
      const blogId = req.params.blogId;
      const blog = await blogService.getBlogById(userId, blogId);
      res.status(200).json(blog);
    } catch (error: unknown) {
      next(error);
    }
  });

  blogRouter.post('/v1/blogs', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const blogCreateInput: CreateBlogDTO = req.body.blog;
      const userId = req.body.user.id;
      const respond = await blogService.postBlog(userId, blogCreateInput);
      res.status(201).json(respond);
    } catch (error: unknown) {
      next(error);
    }
  });

  // Private routes
  blogRouter.get('/private/v1/blogs', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.body.user.id;
      const blogRequest: BlogRequest = {
        title: req.query.title as string || undefined,
        blogType: req.query.blogType as BlogType || undefined,
        tags: req.query.tags ? (req.query.tags as string).split(',') : [],
        skip: parseInt(req.query.skip as string, 10) || 0,
        take: parseInt(req.query.take as string, 10) || 10
      }
      const blogs = await blogService.getBlogs(userId, blogRequest);
      res.status(200).json(blogs);
    } catch (error: unknown) {
      next(error);
    }
  });

  blogRouter.get('/private/v1/blogs/:blogId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.body.user.id;
      const blogId = req.params.blogId;
      const blog = await blogService.getBlogById(userId, blogId);
      res.status(200).json(blog);
    } catch (error: unknown) {
      next(error);
    }
  });

  return blogRouter;
}
