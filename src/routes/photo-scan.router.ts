import express from 'express';

import { authenticate } from '../di/di-container.js';
import { photoScanController } from '../di/di-container.js';
import { API_URLS } from './api.constants.js';

const photoScanRouter = express.Router();

photoScanRouter.post(API_URLS.PHOTO_SCAN.SCAN, authenticate, (req, res, next) => 
  photoScanController.scan(req, res, next));

photoScanRouter.post(API_URLS.PHOTO_SCAN.DELTA_SCAN, authenticate, (req, res, next) => 
  photoScanController.deltaScan(req, res, next));

export default photoScanRouter;