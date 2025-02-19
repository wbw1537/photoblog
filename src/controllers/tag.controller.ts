import { NextFunction, Request, Response } from "express";

import { TagService } from "../services/tag.service.js";
import { CreateTagDTO } from "../models/tag.model.js";

import { PhotoBlogError } from "../errors/photoblog.error.js";

export class TagController {
  constructor (
    private tagService: TagService
  ) {}

  async addTag(req: Request, res: Response, next: NextFunction) {
    try {
      const tagCreateInput: CreateTagDTO = req.body.tag;
      const userId = req.body.user.id;
      this.checkTagInput(tagCreateInput);
      const response = await this.tagService.addTag(userId, tagCreateInput);
      res.status(201).json(response);
    } catch (error: unknown) {
      next(error);
    }
  }

  async updateTag(req: Request, res: Response, next: NextFunction) {
    try {
      const tagCreateInput: CreateTagDTO = req.body.tag;
      const userId = req.body.user.id;
      this.checkTagInput(tagCreateInput);
      const response = await this.tagService.updateTag(userId, tagCreateInput);
      res.status(200).json(response);
    } catch (error: unknown) {
      next(error);
    }
  }

  async deleteTag(req: Request, res: Response, next: NextFunction) {
    try {
      const tagCreateInput: CreateTagDTO = req.body.tag;
      const userId = req.body.user.id;
      this.checkTagInput(tagCreateInput);
      const response = await this.tagService.deleteTag(userId, tagCreateInput);
      res.status(200).json(response);
    } catch (error: unknown) {
      next(error);
    }
  }

  private checkTagInput(tagCreateInput: CreateTagDTO) {
    if (!tagCreateInput.tags || !tagCreateInput.tags.length) {
      throw new PhotoBlogError("No tags provided", 400);
    }
  }
}