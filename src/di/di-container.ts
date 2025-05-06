import { PrismaClient } from '@prisma/client';
import log4js from "log4js";

import { UserRepository } from '../repositories/user.repository.js';
import { PhotoRepository } from '../repositories/photo.repository.js';
import { PhotoFileRepository } from '../repositories/photo-file.repository.js';
import { BlogRepository } from '../repositories/blog.repository.js';
import { TagRepository } from '../repositories/tag.repository.js';
import { SharedUserRepository } from '../repositories/shared-user.repository.js';

import { ConvertPhotoJob } from '../jobs/convert-photo.job.js';
import { PhotoScanJob } from '../jobs/photo-scan.job.js';

import { SharedUserConnector } from '../connectors/shared-user.connector.js';

import { PhotoScanService } from '../services/photo-scan.service.js';
import { ScanStatusService } from '../services/scan-status.service.js';
import { UserService } from '../services/user.service.js';
import { BlogService } from '../services/blog.service.js';
import { TagService } from '../services/tag.service.js';
import { PhotoService } from '../services/photo.service.js';
import { PhotoFileService } from '../services/photo-file.service.js';
import { SharedUserService } from '../services/shared-user.service.js';

import { UserController } from '../controllers/user.controller.js';
import { PhotoScanController } from '../controllers/photo-scan.controller.js';
import { ScanStatusController } from '../controllers/scan-status.controller.js';
import { BlogController } from '../controllers/blog.controller.js';
import { TagController } from '../controllers/tag.controller.js';
import { PhotoController } from '../controllers/photo.controller.js';
import { PhotoFileController } from '../controllers/photo-file.controller.js';
import { SharedUserController } from '../controllers/shared-user.controller.js';

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
const blogRepository = new BlogRepository(prismaClient)
const tagRepository = new TagRepository(prismaClient);
const sharedUserRepository = new SharedUserRepository(prismaClient);

const scanStatusService = new ScanStatusService();

// Job layer instances
const convertPhotoJob = new ConvertPhotoJob(logger);
const photoScanJob = new PhotoScanJob(photoRepository, userRepository, photoFileRepository, scanStatusService, convertPhotoJob, logger);

// Connectors layer instances
const sharedUserConnector = new SharedUserConnector();

// Service layer instances
const photoScanService = new PhotoScanService(scanStatusService, photoScanJob);
const userService = new UserService(userRepository);
const blogService = new BlogService(blogRepository, tagRepository);
const tagService = new TagService(tagRepository, photoRepository, blogRepository);
const photoService = new PhotoService(photoRepository, tagRepository);
const photoFileService = new PhotoFileService(photoFileRepository);
const sharedUserService = new SharedUserService(sharedUserRepository, userRepository, sharedUserConnector);

// Controller layer instances
const userController = new UserController(userService);
const photoScanController = new PhotoScanController(photoScanService);
const scanStatusController = new ScanStatusController(scanStatusService);
const blogController = new BlogController(blogService)
const tagController = new TagController(tagService);
const photoController = new PhotoController(photoService);
const photoFileController = new PhotoFileController(photoFileService);
const sharedUserController = new SharedUserController(sharedUserService);


// Export all initialized instances
export {
  userController,
  photoScanController,
  scanStatusController,
  blogController,
  tagController,
  photoController,
  photoFileController,
  sharedUserController
};
