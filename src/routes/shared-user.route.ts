import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { API_URLS } from './api.constants.js';

import { sharedUserController } from '../di/di-container.js';

const sharedUserRouter = express.Router();

sharedUserRouter.get(API_URLS.SHARED_USER.BASE, authenticate, (req, res, next) => sharedUserController.getSharedUsers(req, res, next));

sharedUserRouter.get(API_URLS.SHARED_USER.FETCH_REMOTE, authenticate, (req, res, next) => sharedUserController.fetchRemoteUsers(req, res, next));
sharedUserRouter.post(API_URLS.SHARED_USER.INIT, authenticate, (req, res, next) => sharedUserController.initSharingRequest(req, res, next));
sharedUserRouter.post(API_URLS.SHARED_USER.ACTIVE, authenticate, (req, res, next) => sharedUserController.setSharedUserActive(req, res, next));

// Public routes
sharedUserRouter.post(API_URLS.SHARED_USER.PUBLIC_INIT, (req, res, next) => sharedUserController.initRemoteSharingRequest(req, res, next));
sharedUserRouter.post(API_URLS.SHARED_USER.PUBLIC_EXCHANGE, (req, res, next) => sharedUserController.exchangeRemotePublicKey(req, res, next));
sharedUserRouter.post(API_URLS.SHARED_USER.PUBLIC_VALIDATE, (req, res, next) => sharedUserController.validateRemotePublicKey(req, res, next));

export default sharedUserRouter;
