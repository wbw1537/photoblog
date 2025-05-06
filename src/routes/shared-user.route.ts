import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { API_URLS } from './api.constants.js';

import { sharedUserController } from '../di/di-container.js';

const sharedUserRouter = express.Router();

sharedUserRouter.get(API_URLS.SHARED_USER.FETCH_REMOTE, authenticate, (req, res, next) => sharedUserController.fetchRemoteUsers(req, res, next));

// Public routes
sharedUserRouter.post(API_URLS.SHARED_USER.INIT_REMOTE, (req, res, next) => sharedUserController.initRemoteSharingRequest(req, res, next));

export default sharedUserRouter;
