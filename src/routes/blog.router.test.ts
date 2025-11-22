
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';
import { createBlogRouter } from './blog.router.js';
import { PhotoBlogError } from '../errors/photoblog.error.js';

vi.mock('../services/blog.service.js');

describe('Blog Router', () => {
  let app: Express;
  let mockBlogService: any;
  let mockAuthenticate: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockBlogService = {
      getBlogs: vi.fn(),
      getBlogById: vi.fn(),
      postBlog: vi.fn(),
    };

    mockAuthenticate = vi.fn((req, res, next) => {
      req.body.user = { id: 'test-user-id' };
      next();
    });

    app = express();
    app.use(express.json());
    app.use('/blogs', createBlogRouter(mockBlogService, mockAuthenticate));

    app.use((err: any, req: any, res: any, next: any) => {
      if (err instanceof PhotoBlogError) {
        res.status(err.statusCode).json({ error: err.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  });

  describe('GET /v1/blogs', () => {
    it('should get blogs successfully', async () => {
      const blogs = [{ id: '1', title: 'Test Blog' }];
      mockBlogService.getBlogs.mockResolvedValue(blogs);

      const response = await request(app).get('/blogs/v1/blogs');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(blogs);
      expect(mockBlogService.getBlogs).toHaveBeenCalledWith('test-user-id', expect.any(Object));
    });
  });

  describe('GET /v1/blogs/:blogId', () => {
    it('should get a blog by id successfully', async () => {
      const blog = { id: '1', title: 'Test Blog' };
      mockBlogService.getBlogById.mockResolvedValue(blog);

      const response = await request(app).get('/blogs/v1/blogs/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(blog);
      expect(mockBlogService.getBlogById).toHaveBeenCalledWith('test-user-id', '1');
    });

    it('should return 404 if blog not found', async () => {
      mockBlogService.getBlogById.mockRejectedValue(new PhotoBlogError('Blog not found', 404));

      const response = await request(app).get('/blogs/v1/blogs/1');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Blog not found');
    });
  });

  describe('POST /v1/blogs', () => {
    it('should create a blog successfully', async () => {
      const newBlog = {
        title: 'New Blog',
        content: 'This is a new blog post.',
        blogType: 'Article',
        blogMedia: [],
      };
      const createdBlog = { id: '1', ...newBlog };
      mockBlogService.postBlog.mockResolvedValue(createdBlog);

      const response = await request(app)
        .post('/blogs/v1/blogs')
        .send(newBlog);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(createdBlog);
      expect(mockBlogService.postBlog).toHaveBeenCalledWith('test-user-id', newBlog);
    });
  });

  describe('GET /private/v1/blogs', () => {
    it('should get blogs successfully', async () => {
      const blogs = [{ id: '1', title: 'Test Blog' }];
      mockBlogService.getBlogs.mockResolvedValue(blogs);

      const response = await request(app).get('/blogs/private/v1/blogs');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(blogs);
      expect(mockBlogService.getBlogs).toHaveBeenCalledWith('test-user-id', expect.any(Object));
    });
  });

  describe('GET /private/v1/blogs/:blogId', () => {
    it('should get a blog by id successfully', async () => {
      const blog = { id: '1', title: 'Test Blog' };
      mockBlogService.getBlogById.mockResolvedValue(blog);

      const response = await request(app).get('/blogs/private/v1/blogs/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(blog);
      expect(mockBlogService.getBlogById).toHaveBeenCalledWith('test-user-id', '1');
    });
  });
});
