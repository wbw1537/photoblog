import { NextFunction, Request, Response } from "express";

import { CreateUserDTO } from "../models/user.model.js";
import { UserService } from "../services/user.service.js";

export class UserController {
  private userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
  }

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, password, email, basePath } = req.body;
      const user: CreateUserDTO = { name, password, email, basePath };
      const newUser = await this.userService.register(user);
      res.status(201).json(newUser);
    } catch (err: unknown) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const token = await this.userService.login(email, password);
      res.status(200).json({ token });
    } catch (err: unknown) {
      next(err);
    }
  }
}