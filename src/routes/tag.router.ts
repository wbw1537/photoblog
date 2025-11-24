import express, { NextFunction, Request, Response, RequestHandler } from 'express';
import { TagService } from "../services/tag.service.js";
import { CreateTagDTO } from "../models/tag.model.js";
import { PhotoBlogError } from "../errors/photoblog.error.js";

export function createTagRouter(
  tagService: TagService,
  authenticate: RequestHandler
) {
  const tagRouter = express.Router();

  const checkTagInput = (tagCreateInput: CreateTagDTO) => {
    if (!tagCreateInput.tags || !tagCreateInput.tags.length) {
      throw new PhotoBlogError("No tags provided", 400);
    }
  };

  tagRouter.post('/v1/tags', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user, ...tagRequest } = req.body;
      checkTagInput(tagRequest);
      const result = await tagService.addTag(user.id, tagRequest);
      res.status(201).json(result);
    } catch (error: unknown) {
      next(error);
    }
  });

  tagRouter.put('/v1/tags', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user, ...tagRequest } = req.body;
      checkTagInput(tagRequest);
      const result = await tagService.updateTag(user.id, tagRequest);
      res.status(200).json(result);
    } catch (error: unknown) {
      next(error);
    }
  });

  tagRouter.delete('/v1/tags', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user, ...tagRequest } = req.body;
      checkTagInput(tagRequest);
      const result = await tagService.deleteTag(user.id, tagRequest);
      res.status(200).json(result);
    } catch (error: unknown) {
      next(error);
    }
  });

  return tagRouter;
}
