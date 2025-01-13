import { PrismaClient } from '@prisma/client';

import { UserService } from '../services/user.service.js';
import { PhotoScanService } from '../services/photo-scan.service.js';

import { UserController } from '../controllers/user.controller.js';
import { PhotoScanController } from '../controllers/photo-scan.controller.js';

// Singleton Prisma instance
const prisma = new PrismaClient();

// Service layer instances
const userService = new UserService(prisma);
const photoScanService = new PhotoScanService();

// Controller layer instances
const userController = new UserController(userService);
const photoScanController = new PhotoScanController(photoScanService);

// Export all initialized instances
export { userController, photoScanController };