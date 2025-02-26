import express from 'express';

import { authenticate } from '../middleware/auth.middleware.js';
import { photoScanController } from '../di/di-container.js';

const photoScanRouter = express.Router();

photoScanRouter.post('/v1/scan', authenticate, (req, res, next) => photoScanController.scan(req, res, next));
photoScanRouter.post('/v1/delta-scan', authenticate, (req, res, next) => photoScanController.deltaScan(req, res, next));

export default photoScanRouter;