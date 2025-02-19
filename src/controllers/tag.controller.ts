import { Request, Response } from "express";

import { TagService } from "../services/tag.service.js";
import { CreateTagDTO } from "../models/tag.model.js";

export class TagController {
  constructor (
    private tagService: TagService
  ) {}

  async addTag(req: Request, res: Response) {
    const tagCreateInput: CreateTagDTO = req.body.tag;
    const userId = req.body.user.id;
    if (!tagCreateInput.tags || !tagCreateInput.tags.length) {
      throw new Error("No tags provided");
    }

    try {
      const response = await this.tagService.addTag(userId, tagCreateInput);
      res.status(201).json(response);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ "message": error.message });
    }
  }

  async updateTag(req: Request, res: Response) {
    const tagCreateInput: CreateTagDTO = req.body.tag;
    const userId = req.body.user.id;
    if (!tagCreateInput.tags || !tagCreateInput.tags.length) {
      throw new Error("No tags provided");
    }

    try {
      const response = await this.tagService.updateTag(userId, tagCreateInput);
      res.status(200).json(response);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ "message": error.message });
    }
  }

  async deleteTag(req: Request, res: Response) {
    const tagCreateInput: CreateTagDTO = req.body.tag;
    const userId = req.body.user.id;
    if (!tagCreateInput.tags || !tagCreateInput.tags.length) {
      throw new Error("No tags provided");
    }

    try {
      const response = await this.tagService.deleteTag(userId, tagCreateInput);
      res.status(200).json(response);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ "message": error.message });
    }
  }
}