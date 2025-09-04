import express from 'express';
import { authenticate } from '../di/di-container.js';
import { API_URLS } from './api.constants.js';

import { photoFileController } from '../di/di-container.js';

const photoFileRouter = express.Router();

photoFileRouter.get(API_URLS.PHOTO_FILE.VIEW, authenticate, (req, res, next) => 
  photoFileController.getPhotoFileImageById(req, res, next));

photoFileRouter.get(API_URLS.PHOTO_FILE.PREVIEW, authenticate, (req, res, next) => 
  photoFileController.getPreviewPhotoFileById(req, res, next));

// Private routes
photoFileRouter.get(API_URLS.PHOTO_FILE.PRIVATE_VIEW, authenticate, (req, res, next) => 
  photoFileController.getPhotoFileImageById(req, res, next));

photoFileRouter.get(API_URLS.PHOTO_FILE.PRIVATE_PREVIEW, authenticate, (req, res, next) => 
  photoFileController.getPreviewPhotoFileById(req, res, next));

export default photoFileRouter;
