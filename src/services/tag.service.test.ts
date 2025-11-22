import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TagService } from './tag.service.js';
import { PhotoBlogError } from '../errors/photoblog.error.js';

describe('TagService', () => {
  let tagService: TagService;
  let mockTagRepository: any;
  let mockPhotoRepository: any;
  let mockBlogRepository: any;

  const userId = 'user-1';
  const photoId = 'photo-1';
  const blogId = 'blog-1';
  const tags = ['nature', 'landscape'];

  const mockPhoto = { id: photoId, userId: userId, title: 'Test Photo' };
  const mockBlog = { id: blogId, userId: userId, title: 'Test Blog' };

  beforeEach(() => {
    vi.clearAllMocks();
    mockTagRepository = {
      createPhotoTag: vi.fn(),
      createBlogTag: vi.fn(),
      updatePhotoTags: vi.fn(),
      updateBlogTags: vi.fn(),
      deletePhotoTags: vi.fn(),
      deleteBlogTags: vi.fn(),
      findTagIds: vi.fn().mockResolvedValue(['tagId1', 'tagId2']),
    };
    mockPhotoRepository = {
      findById: vi.fn(),
    };
    mockBlogRepository = {
      findById: vi.fn(),
    };
    tagService = new TagService(mockTagRepository, mockPhotoRepository, mockBlogRepository);
  });

  describe('addTag', () => {
    it('should add tags to a photo if authorized', async () => {
      mockPhotoRepository.findById.mockResolvedValue(mockPhoto);
      await tagService.addTag(userId, { resourceType: 'photo', resourceId: photoId, tags });
      expect(mockTagRepository.createPhotoTag).toHaveBeenCalledWith(photoId, tags);
    });

    it('should add tags to a blog if authorized', async () => {
      mockBlogRepository.findById.mockResolvedValue(mockBlog);
      await tagService.addTag(userId, { resourceType: 'blog', resourceId: blogId, tags });
      expect(mockTagRepository.createBlogTag).toHaveBeenCalledWith(blogId, tags);
    });

    it('should throw 404 if photo not found', async () => {
      mockPhotoRepository.findById.mockResolvedValue(null);
      await expect(tagService.addTag(userId, { resourceType: 'photo', resourceId: 'non-existent', tags })).rejects.toThrow(new PhotoBlogError('Photo not found', 404));
    });

    it('should throw 403 if not authorized to add tag to photo', async () => {
      mockPhotoRepository.findById.mockResolvedValue({ ...mockPhoto, userId: 'other-user' });
      await expect(tagService.addTag(userId, { resourceType: 'photo', resourceId: photoId, tags })).rejects.toThrow(new PhotoBlogError('Unauthorized', 403));
    });
  });

  describe('updateTag', () => {
    it('should update tags for a photo if authorized', async () => {
      mockPhotoRepository.findById.mockResolvedValue(mockPhoto);
      await tagService.updateTag(userId, { resourceType: 'photo', resourceId: photoId, tags });
      expect(mockTagRepository.updatePhotoTags).toHaveBeenCalledWith(photoId, tags);
    });

    it('should update tags for a blog if authorized', async () => {
      mockBlogRepository.findById.mockResolvedValue(mockBlog);
      await tagService.updateTag(userId, { resourceType: 'blog', resourceId: blogId, tags });
      expect(mockTagRepository.updateBlogTags).toHaveBeenCalledWith(blogId, tags);
    });
  });

  describe('deleteTag', () => {
    it('should delete tags from a photo if authorized', async () => {
      mockPhotoRepository.findById.mockResolvedValue(mockPhoto);
      await tagService.deleteTag(userId, { resourceType: 'photo', resourceId: photoId, tags });
      expect(mockTagRepository.findTagIds).toHaveBeenCalledWith(tags);
      expect(mockTagRepository.deletePhotoTags).toHaveBeenCalledWith(photoId, ['tagId1', 'tagId2']);
    });

    it('should delete tags from a blog if authorized', async () => {
      mockBlogRepository.findById.mockResolvedValue(mockBlog);
      await tagService.deleteTag(userId, { resourceType: 'blog', resourceId: blogId, tags });
      expect(mockTagRepository.findTagIds).toHaveBeenCalledWith(tags);
      expect(mockTagRepository.deleteBlogTags).toHaveBeenCalledWith(blogId, ['tagId1', 'tagId2']);
    });
  });
});
