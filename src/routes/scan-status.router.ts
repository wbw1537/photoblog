import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { API_URLS } from './api.constants.js';

import { scanStatusController } from '../di/di-container.js';

const scanStatusRouter = express.Router();

scanStatusRouter.get(API_URLS.SCAN_STATUS.BASE, authenticate, (req, res, next) => scanStatusController.getStatus(req, res, next));

export default scanStatusRouter;