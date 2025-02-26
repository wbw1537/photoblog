import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { blogController } from '../di/di-container.js';

const blogRouter = express.Router();


blogRouter.get('/v1/blogs', authenticate, (req, res, next) => blogController.getBlogs(req, res, next));
blogRouter.get('/v1/blogs/:blogId', authenticate, (req, res, next) => blogController.getBlogById(req, res, next));
blogRouter.post('/v1/blogs', authenticate, (req, res, next) => blogController.postBlog(req, res, next));

export default blogRouter;
