import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { blogController } from '../di/di-container.js';

const blogRouter = express.Router();

blogRouter.post('/v1/blog', authenticate, (req, res, next) => blogController.postBlog(req, res, next));

export default blogRouter;
