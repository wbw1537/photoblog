
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';
import { createTagRouter } from './tag.router.js';
import { PhotoBlogError } from '../errors/photoblog.error.js';

vi.mock('../services/tag.service.js');

describe('Tag Router', () => {
  let app: Express;
  let mockTagService: any;
  let mockAuthenticate: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockTagService = {
      addTag: vi.fn(),
      updateTag: vi.fn(),
      deleteTag: vi.fn(),
    };

    mockAuthenticate = vi.fn((req, res, next) => {
      req.body.user = { id: 'test-user-id' };
      next();
    });

    app = express();
    app.use(express.json());
    app.use('/tags', createTagRouter(mockTagService, mockAuthenticate));

    app.use((err: any, req: any, res: any, next: any) => {
      if (err instanceof PhotoBlogError) {
        res.status(err.statusCode).json({ error: err.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  });

  describe('POST /v1/tags', () => {
    it('should add tags successfully', async () => {
      const newTags = { tags: [{ name: 'new-tag' }] };
      mockTagService.addTag.mockResolvedValue({ count: 1 });

      const response = await request(app)
        .post('/tags/v1/tags')
        .send({ tag: newTags });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ count: 1 });
      expect(mockTagService.addTag).toHaveBeenCalledWith('test-user-id', newTags);
    });

    it('should return 400 if no tags provided', async () => {
        const response = await request(app)
            .post('/tags/v1/tags')
            .send({ tag: { tags: [] } });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('No tags provided');
    });
  });

  describe('PUT /v1/tags', () => {
    it('should update tags successfully', async () => {
      const updatedTags = { tags: [{ name: 'updated-tag' }] };
      mockTagService.updateTag.mockResolvedValue({ count: 1 });

      const response = await request(app)
        .put('/tags/v1/tags')
        .send({ tag: updatedTags });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ count: 1 });
      expect(mockTagService.updateTag).toHaveBeenCalledWith('test-user-id', updatedTags);
    });
  });

  describe('DELETE /v1/tags', () => {
    it('should delete tags successfully', async () => {
      const deletedTags = { tags: [{ name: 'deleted-tag' }] };
      mockTagService.deleteTag.mockResolvedValue({ count: 1 });

      const response = await request(app)
        .delete('/tags/v1/tags')
        .send({ tag: deletedTags });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ count: 1 });
      expect(mockTagService.deleteTag).toHaveBeenCalledWith('test-user-id', deletedTags);
    });
  });
});
