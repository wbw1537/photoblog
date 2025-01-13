import express from 'express';

import { photoScanController } from '../di/di-container.js';

const photoScanRouter = express.Router();

photoScanRouter.post('/v1/scan', (req, res) => photoScanController.scan(req, res));

export default photoScanRouter;