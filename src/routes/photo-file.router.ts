import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';

import { photoFileController } from '../di/di-container.js';

const photoFileRouter = express.Router();

photoFileRouter.get('/v1/photos/view/:fileId', authenticate, (req, res, next) => photoFileController.getPhotoFileImageById(req, res, next));

export default photoFileRouter;
