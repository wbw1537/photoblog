import express from 'express';

import { authenticate } from '../middleware/auth.middleware.js';
import { tagController } from '../di/di-container.js';

const tagRouter = express.Router();

tagRouter.post('/v1/tags', authenticate, (req, res, next) => tagController.addTag(req, res, next));
tagRouter.put('/v1/tags', authenticate, (req, res, next) => tagController.updateTag(req, res, next));
tagRouter.delete('/v1/tags', authenticate, (req, res, next) => tagController.deleteTag(req, res, next));

export default tagRouter;
