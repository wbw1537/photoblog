import { Request, Response } from "express";

import { User } from "../models/user.model.js";
import { UserService } from "../services/user.service.js";

export class UserController {
  private userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
  }

  async register(req: Request, res: Response) {
    try {
      const { name, password, email } = req.body;
      const user = User.create(name, password, email);
      const newUser = await this.userService.register(user);
      res.status(201).json(newUser);
    } catch (err) {
      console.error(err);
      res.status(500).send("An error occurred while registering the user");
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const token = await this.userService.login(email, password);
      res.status(200).json({ token });
    } catch (err) {
      console.error(err);
      res.status(401).send("Invalid email or password");
    }
  }
}