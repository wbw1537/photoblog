import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BlogService } from './blog.service.js';
import { PhotoBlogError } from '../errors/photoblog.error.js';
import { BlogType, MediaType } from '@prisma/client';

vi.mock('../repositories/blog.repository.js');
vi.mock('../repositories/tag.repository.js');

describe('BlogService', () => {
  let blogService: BlogService;
  let mockBlogRepository: any;
  let mockTagRepository: any;

  const userId = 'user-1';
  const mockBlog = {
    id: 'blog-1',
    userId: userId,
    title: 'Test Blog',
    content: 'Test content',
    blogType: BlogType.STANDARD,
    isDeleted: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockBlogRepository = {
      findAllByFilter: vi.fn(),
      findById: vi.fn(),
      createBlog: vi.fn(),
    };
    mockTagRepository = {
      findTagIds: vi.fn(),
    };
    blogService = new BlogService(mockBlogRepository, mockTagRepository);
  });

  describe('getBlogs', () => {
    it('should return a list of blogs', async () => {
      mockBlogRepository.findAllByFilter.mockResolvedValue([mockBlog]);
      const blogs = await blogService.getBlogs(userId, {});
      expect(blogs).toEqual([mockBlog]);
      expect(mockBlogRepository.findAllByFilter).toHaveBeenCalled();
    });

    it('should filter blogs by tags', async () => {
      mockTagRepository.findTagIds.mockResolvedValue(['tag-1']);
      await blogService.getBlogs(userId, { tags: ['travel'] });
      expect(mockTagRepository.findTagIds).toHaveBeenCalledWith(['travel']);
      const whereClause = mockBlogRepository.findAllByFilter.mock.calls[0][2];
      expect(whereClause.tags).toBeDefined();
    });
  });

  describe('getBlogById', () => {
    it('should return a blog if found and user is authorized', async () => {
      mockBlogRepository.findById.mockResolvedValue(mockBlog);
      const result = await blogService.getBlogById(userId, 'blog-1');
      expect(result.data).toEqual(mockBlog);
    });

    it('should throw 404 if blog not found', async () => {
      mockBlogRepository.findById.mockResolvedValue(null);
      await expect(blogService.getBlogById(userId, 'blog-1')).rejects.toThrow(new PhotoBlogError('Blog not found', 404));
    });

    it('should throw 403 if user is not authorized', async () => {
      const otherUserBlog = { ...mockBlog, userId: 'user-2' };
      mockBlogRepository.findById.mockResolvedValue(otherUserBlog);
      await expect(blogService.getBlogById(userId, 'blog-1')).rejects.toThrow(new PhotoBlogError('Unauthorized', 403));
    });
  });

  describe('postBlog', () => {
    it('should create and return a new blog', async () => {
      const blogCreateInput = {
        title: 'New Blog',
        content: 'New content',
        blogType: 'Article',
        blogMedia: [
          { mediaId: 'photo-1', mediaType: 'Photo', mediaPosition: 1 },
        ],
      };
      mockBlogRepository.createBlog.mockResolvedValue({ ...mockBlog, ...blogCreateInput });

      const result = await blogService.postBlog(userId, blogCreateInput);
      expect(result.title).toBe('New Blog');
      expect(mockBlogRepository.createBlog).toHaveBeenCalled();
    });

    it('should throw an error for invalid blog type', async () => {
      const blogCreateInput = {
        title: 'New Blog',
        content: 'New content',
        blogType: 'INVALID_TYPE' as BlogType,
        blogMedia: [],
      };
      await expect(blogService.postBlog(userId, blogCreateInput)).rejects.toThrow(new PhotoBlogError('Invalid blog type', 400));
    });

    it('should throw an error for invalid media type', async () => {
      const blogCreateInput = {
        title: 'New Blog',
        content: 'New content',
        blogType: 'Article',
        blogMedia: [
          { mediaId: 'photo-1', mediaType: 'INVALID' as MediaType, mediaPosition: 1 },
        ],
      };
      await expect(blogService.postBlog(userId, blogCreateInput)).rejects.toThrow(new PhotoBlogError('Invalid media type', 400));
    });
  });
});
