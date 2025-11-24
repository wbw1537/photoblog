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
      const user = req.body.user;
      const blogRequest: BlogRequest = {
        title: req.query.title as string || undefined,
        blogType: req.query.blogType as BlogType || undefined,
        tags: req.query.tags ? (req.query.tags as string).split(',') : [],
        skip: parseInt(req.query.skip as string, 10) || 0,
        take: parseInt(req.query.take as string, 10) || 10
      }
      const blogs = await blogService.getBlogs(user.id, blogRequest);
      res.status(200).json(blogs);
    } catch (error: unknown) {
      next(error);
    }
  });

  blogRouter.get('/v1/blogs/:blogId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.body.user;
      const blogId = req.params.blogId;
      const blog = await blogService.getBlogById(user.id, blogId);
      res.status(200).json(blog);
    } catch (error: unknown) {
      next(error);
    }
  });

  blogRouter.post('/v1/blogs', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user, ...blogCreateInput } = req.body;
      const newBlog = await blogService.postBlog(user.id, blogCreateInput);
      res.status(201).json(newBlog);
    } catch (error: unknown) {
      next(error);
    }
  });

  // Private routes
  blogRouter.get('/private/v1/blogs', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.body.user;
      const blogRequest: BlogRequest = {
        title: req.query.title as string || undefined,
        blogType: req.query.blogType as BlogType || undefined,
        tags: req.query.tags ? (req.query.tags as string).split(',') : [],
        skip: parseInt(req.query.skip as string, 10) || 0,
        take: parseInt(req.query.take as string, 10) || 10
      }
      const blogs = await blogService.getBlogs(user.id, blogRequest);
      res.status(200).json(blogs);
    } catch (error: unknown) {
      next(error);
    }
  });

  blogRouter.get('/private/v1/blogs/:blogId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.body.user;
      const blogId = req.params.blogId;
      const blog = await blogService.getBlogById(user.id, blogId);
      res.status(200).json(blog);
    } catch (error: unknown) {
      next(error);
    }
  });

  return blogRouter;
}
