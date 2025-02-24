import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';

import { photoController } from '../di/di-container.js';

const photoRouter = express.Router();

photoRouter.get('/v1/photos', authenticate, (req, res, next) => photoController.getPhotos(req, res, next));
photoRouter.get('/v1/photos/:id', authenticate, (req, res, next) => photoController.getPhotoById(req, res, next));
photoRouter.post('/v1/photos/:id/like', authenticate, (req, res, next) => photoController.likePhoto(req, res, next));
photoRouter.delete('/v1/photos/:id/like', authenticate, (req, res, next) => photoController.unlikePhoto(req, res, next));

export default photoRouter;