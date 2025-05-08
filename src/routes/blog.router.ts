import express from 'express';
import { authenticate, authenticateSharedUser } from '../di/di-container.js';
import { blogController } from '../di/di-container.js';
import { API_URLS } from './api.constants.js';

const blogRouter = express.Router();

blogRouter.get(API_URLS.BLOG.BASE, authenticate, (req, res, next) => 
  blogController.getBlogs(req, res, next));

blogRouter.get(API_URLS.BLOG.BY_ID, authenticate, (req, res, next) => 
  blogController.getBlogById(req, res, next));

blogRouter.post(API_URLS.BLOG.BASE, authenticate, (req, res, next) => 
  blogController.postBlog(req, res, next));

// Private routes
blogRouter.get(API_URLS.BLOG.PUBLIC_BASE, authenticateSharedUser, (req, res, next) => 
  blogController.getBlogs(req, res, next));

blogRouter.get(API_URLS.BLOG.PUBLIC_BY_ID, authenticateSharedUser, (req, res, next) => 
  blogController.getBlogById(req, res, next));

export default blogRouter;
