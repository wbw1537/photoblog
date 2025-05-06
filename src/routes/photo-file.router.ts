import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { API_URLS } from './api.constants.js';

import { photoFileController } from '../di/di-container.js';

const photoFileRouter = express.Router();

photoFileRouter.get(API_URLS.PHOTO_FILE.VIEW, authenticate, (req, res, next) => photoFileController.getPhotoFileImageById(req, res, next));
photoFileRouter.get(API_URLS.PHOTO_FILE.PREVIEW, authenticate, (req, res, next) => photoFileController.getPreviewPhotoFileById(req, res, next));

export default photoFileRouter;
