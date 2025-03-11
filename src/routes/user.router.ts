import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';

import { userController } from '../di/di-container.js';

const userRouter = express.Router();

userRouter.post('/v1/register', (req, res, next) => userController.register(req, res, next));
userRouter.post('/v1/login', (req, res, next) => userController.login(req, res, next));
userRouter.post('/v1/email-availability', (req, res, next) => userController.checkUserExists(req, res, next));
userRouter.post('/v1/user-info', authenticate ,(req, res, next) => userController.getUserInfo(req, res, next));
userRouter.post('/v1/refresh-token', (req, res, next) => userController.refreshToken(req, res, next));

export default userRouter;
