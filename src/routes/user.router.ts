import express, { NextFunction, Request, Response, RequestHandler } from 'express';
import { CreateUserDTO, ModifyUserInfoRequestDTO, TokenResponseDTO } from "../models/user.model.js";
import { UserService } from "../services/user.service.js";
import { PhotoBlogError } from "../errors/photoblog.error.js";

export function createUserRouter(
  userService: UserService,
  authenticate: RequestHandler
) {
  const userRouter = express.Router();

  userRouter.post('/v1/register', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, password, email } = req.body;
      const user: CreateUserDTO = { name, password, email };
      const newUser = await userService.register(user);
      res.status(201).json(newUser);
    } catch (err: unknown) {
      next(err);
    }
  });

  userRouter.post('/v1/login', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const user = await userService.login(email, password);
      res.status(200).json(user);
    } catch (err: unknown) {
      next(err);
    }
  });

  userRouter.post('/v1/email-availability', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== 'string') {
        throw new PhotoBlogError('Email parameter is required', 400);
      }
      const exists = await userService.checkUserExists(email);
      res.status(200).json({ exists });
    } catch (err: unknown) {
      next(err);
    }
  });

  userRouter.get('/v1/user-info', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.body.user.id;
      const user = await userService.getUserInfo(userId);
      res.status(200).json(user);
    } catch (err: unknown) {
      next(err);
    }
  });

  userRouter.put('/v1/user-info', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.body.user.id;
      const modifyRequest: ModifyUserInfoRequestDTO = req.body;
      const user = await userService.modifyUserInfo(userId, modifyRequest);
      res.status(200).json(user);
    } catch (err: unknown) {
      next(err);
    }
  });

  userRouter.post('/v1/refresh-token', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken || typeof refreshToken !== 'string') {
        throw new PhotoBlogError('Refresh token is required', 400);
      }
      const tokens: TokenResponseDTO = await userService.refreshToken(refreshToken);
      res.status(200).json(tokens);
    } catch (err: unknown) {
      next(err);
    }
  });

  // Public routes
  userRouter.get('/public/v1/users', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await userService.getUsers();
      res.status(200).json({ users });
    } catch (err: unknown) {
      next(err);
    }
  });

  return userRouter;
}
