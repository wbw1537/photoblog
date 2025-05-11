import express from 'express';
import { authenticate, authenticateSharedUser, encrypt } from '../di/di-container.js';
import { API_URLS } from './api.constants.js';

import { photoController } from '../di/di-container.js';

const photoRouter = express.Router();

photoRouter.get(API_URLS.PHOTO.BASE, authenticate, (req, res, next) => 
  photoController.getPhotos(req, res, next));

photoRouter.get(API_URLS.PHOTO.BY_ID, authenticate, (req, res, next) => 
  photoController.getPhotoById(req, res, next));

photoRouter.post(API_URLS.PHOTO.LIKE, authenticate, (req, res, next) => 
  photoController.likePhoto(req, res, next));

photoRouter.delete(API_URLS.PHOTO.LIKE, authenticate, (req, res, next) => 
  photoController.unlikePhoto(req, res, next));

// Private routes
photoRouter.get(API_URLS.PHOTO.PRIVATE_BASE, authenticateSharedUser, encrypt, (req, res, next) => 
  photoController.getPhotos(req, res, next));

photoRouter.get(API_URLS.PHOTO.PRIVATE_BY_ID, authenticateSharedUser, encrypt, (req, res, next) => 
  photoController.getPhotoById(req, res, next));

export default photoRouter;