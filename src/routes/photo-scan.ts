import express from 'express';

import { PhotoScanController } from '../controllers/photo-scan.controller.js';
import { PhotoScanService } from '../services/photo-scan.service.js';

const router = express.Router();

// Initialize services
const photoScanService = new PhotoScanService();

// Initialize controllers
const photoScanController = new PhotoScanController(photoScanService);

router.post('/v1/scan', (req, res) => photoScanController.scan(req, res));

export default router;