import express from 'express';

import { userController } from '../di/di-container.js';

const userRouter = express.Router();

userRouter.post('/v1/register', (req, res, next) => userController.register(req, res, next));
userRouter.post('/v1/login', (req, res, next) => userController.login(req, res, next));

export default userRouter;
