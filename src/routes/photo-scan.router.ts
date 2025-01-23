import express from 'express';

import { authenticate } from '../middleware/auth.middleware.js';
import { photoScanController } from '../di/di-container.js';

const photoScanRouter = express.Router();

photoScanRouter.post('/v1/scan', authenticate, (req, res) => photoScanController.scan(req, res));
photoScanRouter.post('/v1/delta-scan', authenticate, (req, res) => photoScanController.deltaScan(req, res));

export default photoScanRouter;