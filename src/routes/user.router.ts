import express from 'express';
import { authenticate } from '../di/di-container.js';
import { API_URLS } from './api.constants.js';

import { userController } from '../di/di-container.js';

const userRouter = express.Router();

userRouter.post(API_URLS.USER.REGISTER, (req, res, next) => 
  userController.register(req, res, next));

userRouter.post(API_URLS.USER.LOGIN, (req, res, next) => 
  userController.login(req, res, next));

userRouter.post(API_URLS.USER.EMAIL_AVAILABILITY, (req, res, next) => 
  userController.checkUserExists(req, res, next));

userRouter.get(API_URLS.USER.USER_INFO, authenticate, (req, res, next) => 
  userController.getUserInfo(req, res, next));

userRouter.put(API_URLS.USER.USER_INFO, authenticate, (req, res, next) => 
  userController.modifyUserInfo(req, res, next));

userRouter.post(API_URLS.USER.REFRESH_TOKEN, (req, res, next) => 
  userController.refreshToken(req, res, next));

// Public routes
userRouter.get(API_URLS.USER.PUBLIC_USERS, (req, res, next) => 
  userController.getUsers(req, res, next));

export default userRouter;
