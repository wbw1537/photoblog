import { NextFunction, Request, Response } from "express";

import { CreateUserDTO, placeholder } from "../models/user.model.js";
import { UserService } from "../services/user.service.js";

export class UserController {
  private userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
  }

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, password, email } = req.body;
      const user: CreateUserDTO = { name, password, email, basePath: placeholder };
      const newUser = await this.userService.register(user);
      res.status(201).json(newUser);
    } catch (err: unknown) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const user = await this.userService.login(email, password);
      res.status(200).json(user);
    } catch (err: unknown) {
      next(err);
    }
  }

  async checkUserExists(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      if (!email || typeof email !== 'string') {
        res.status(400).json({ error: 'Email parameter is required' });
        return;
      }
      const exists = await this.userService.checkUserExists(email);
      res.status(200).json({ exists });
    } catch (err: unknown) {
      next(err);
    }
  }
}