import express from 'express';

import { authenticate } from '../middleware/auth.middleware.js';
import { blogController } from '../di/di-container.js';

const blogRouter = express.Router();

blogRouter.post('/v1/blog', authenticate, (req, res) => blogController.postBlog(req, res));

export default blogRouter;
