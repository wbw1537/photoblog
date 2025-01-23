import { PrismaClient } from '@prisma/client';
import log4js from "log4js";

import { UserRepository } from '../repositories/user.repository.js';
import { PhotoRepository } from '../repositories/photo.repository.js';
import { PhotoFileRepository } from '../repositories/photo-file.repository.js';

import { PhotoScanJob } from '../jobs/photo-scan.job.js';

import { PhotoScanService } from '../services/photo-scan.service.js';
import { ScanStatusService } from '../services/scan-status.service.js';
import { UserService } from '../services/user.service.js';

import { UserController } from '../controllers/user.controller.js';
import { PhotoScanController } from '../controllers/photo-scan.controller.js';

// Logger instance
log4js.configure({
  appenders: { console: { type: "console" } },
  categories: { default: { appenders: ["console"], level: "ALL" } }
});
const logger = log4js.getLogger();

// Singleton Prisma instance
const prismaClient = new PrismaClient();

// repository layer instances
const userRepository = new UserRepository(prismaClient);
const photoRepository = new PhotoRepository(prismaClient);
const photoFileRepository = new PhotoFileRepository(prismaClient);

const scanStatusService = new ScanStatusService();

// Job layer instances
const photoScanJob = new PhotoScanJob(photoRepository, userRepository, photoFileRepository, scanStatusService, logger);

// Service layer instances
const photoScanService = new PhotoScanService(scanStatusService, photoScanJob);
const userService = new UserService(prismaClient, userRepository);

// Controller layer instances
const userController = new UserController(userService);
const photoScanController = new PhotoScanController(photoScanService);

// Export all initialized instances
export { userController, photoScanController };