import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';

import { scanStatusController } from '../di/di-container.js';

const scanStatusRouter = express.Router();

scanStatusRouter.get('/v1/scan-status', authenticate, (req, res, next) => scanStatusController.getStatus(req, res, next));

export default scanStatusRouter;