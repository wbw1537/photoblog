import express from 'express';

import { userController } from '../di/di-container.js';

const userRouter = express.Router();

userRouter.post('/v1/register', (req, res) => userController.register(req, res));
userRouter.post('/v1/login', (req, res) => userController.login(req, res));

export default userRouter;
