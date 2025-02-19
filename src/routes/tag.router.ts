import express from 'express';

import { authenticate } from '../middleware/auth.middleware.js';
import { tagController } from '../di/di-container.js';

const tagRouter = express.Router();

tagRouter.post('/v1/tags', authenticate, (req, res) => tagController.addTag(req, res));
tagRouter.put('/v1/tags', authenticate, (req, res) => tagController.updateTag(req, res));
tagRouter.delete('/v1/tags', authenticate, (req, res) => tagController.deleteTag(req, res));

export default tagRouter;
