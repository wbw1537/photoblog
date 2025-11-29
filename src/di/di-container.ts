import { PrismaClient } from '@prisma/client';
import log4js from "log4js";

import { UserRepository } from '../repositories/user.repository.js';
import { PhotoRepository } from '../repositories/photo.repository.js';
import { PhotoFileRepository } from '../repositories/photo-file.repository.js';
import { PhotoLocationRepository } from '../repositories/photo-location.repository.js';
import { BlogRepository } from '../repositories/blog.repository.js';
import { TagRepository } from '../repositories/tag.repository.js';
import { UserRelationshipRepository } from '../repositories/user-relationship.repository.js';

import { AuthMiddleware } from '../middleware/auth.middleware.js';

import { PhotoScanJob } from '../jobs/photo-scan.job.js';
import { LazyPhotoProcessorPool } from '../jobs/lazy-photo-processor-pool.js';

import { RemoteUserConnector } from '../connectors/remote-user.connector.js';

import { PhotoScanService } from '../services/photo-scan.service.js';
import { ScanStatusService } from '../services/scan-status.service.js';
import { UserService } from '../services/user.service.js';
import { BlogService } from '../services/blog.service.js';
import { TagService } from '../services/tag.service.js';
import { PhotoService } from '../services/photo.service.js';
import { PhotoFileService } from '../services/photo-file.service.js';
import { SharedUserService } from '../services/shared-user.service.js';
import { MetadataExtractionService } from '../services/metadata-extraction.service.js';
import { PreviewGenerationService } from '../services/preview-generation.service.js';
import { FileProcessingService } from '../services/file-processing.service.js';

import { createUserRouter } from '../routes/user.router.js';
import { createPhotoScanRouter } from '../routes/photo-scan.router.js';
import { createScanStatusRouter } from '../routes/scan-status.router.js';
import { createBlogRouter } from '../routes/blog.router.js';
import { createTagRouter } from '../routes/tag.router.js';
import { createPhotoRouter } from '../routes/photo.router.js';
import { createPhotoFileRouter } from '../routes/photo-file.router.js';
import { createSharedUserRouter } from '../routes/shared-user.route.js';
import { EncryptionMiddleware } from '../middleware/encryption.middleware.js';

// Logger instance
log4js.configure({
  appenders: { console: { type: "console" } },
  categories: { default: { appenders: ["console"], level: "ALL" } }
});
const logger = log4js.getLogger();

// Singleton Prisma instance
const prismaClient = new PrismaClient();

// Repository layer instances
const userRepository = new UserRepository(prismaClient);
const photoRepository = new PhotoRepository(prismaClient);
const photoFileRepository = new PhotoFileRepository(prismaClient);
const photoLocationRepository = new PhotoLocationRepository(prismaClient);
const blogRepository = new BlogRepository(prismaClient)
const tagRepository = new TagRepository(prismaClient);
const userRelationshipRepository = new UserRelationshipRepository(prismaClient);

// Service layer instances (core services)
const scanStatusService = new ScanStatusService();
const metadataExtractionService = new MetadataExtractionService(logger);
const previewGenerationService = new PreviewGenerationService(logger);

// Middleware layer instances
const authMiddleware = new AuthMiddleware(logger);
const authenticate = authMiddleware.authenticate;
const encryptionMiddleware = new EncryptionMiddleware();
const encrypt = encryptionMiddleware.encrypt;

// Job layer instances
// Lazy-initialized worker pool (creates workers on first scan, auto-terminates after 5min idle)
const photoProcessorPool = new LazyPhotoProcessorPool(photoFileRepository, logger);

// File processing service (facade)
const fileProcessingService = new FileProcessingService(
  metadataExtractionService,
  photoRepository,
  photoFileRepository,
  photoLocationRepository,
  photoProcessorPool,
  logger
);

const photoScanJob = new PhotoScanJob(
  fileProcessingService,
  photoRepository,
  photoFileRepository,
  userRepository,
  scanStatusService,
  logger,
  photoProcessorPool
);

// Connectors layer instances
const remoteUserConnector = new RemoteUserConnector(logger);

// Service layer instances
const photoScanService = new PhotoScanService(scanStatusService, photoScanJob);
const userService = new UserService(logger, userRepository);
const blogService = new BlogService(blogRepository, tagRepository);
const tagService = new TagService(tagRepository, photoRepository, blogRepository);
const photoService = new PhotoService(photoRepository, tagRepository);
const photoFileService = new PhotoFileService(photoFileRepository);
const sharedUserService = new SharedUserService(logger, userRelationshipRepository, userRepository, remoteUserConnector);

// Router factory functions
const createRouters = () => ({
  userRouter: createUserRouter(userService, authenticate),
  photoScanRouter: createPhotoScanRouter(photoScanService, authenticate),
  scanStatusRouter: createScanStatusRouter(scanStatusService, authenticate),
  blogRouter: createBlogRouter(blogService, authenticate),
  tagRouter: createTagRouter(tagService, authenticate),
  photoRouter: createPhotoRouter(photoService, authenticate),
  photoFileRouter: createPhotoFileRouter(photoFileService, authenticate),
  sharedUserRouter: createSharedUserRouter(sharedUserService, authenticate)
});


// Graceful shutdown handler
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing application gracefully');
  try {
    // Close metadata extraction service (ends exiftool process)
    await metadataExtractionService.close();
    logger.info('Metadata extraction service closed');

    // Close preview generation service
    await previewGenerationService.close();
    logger.info('Preview generation service closed');

    // Terminate worker pool
    await photoProcessorPool.forceTerminate();
    logger.info('Worker pool terminated');

    // Disconnect Prisma
    await prismaClient.$disconnect();
    logger.info('Database disconnected');

    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing application gracefully');
  try {
    await metadataExtractionService.close();
    await previewGenerationService.close();
    await photoProcessorPool.forceTerminate();
    await prismaClient.$disconnect();
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Export all initialized instances
export {
  authenticate,
  encrypt,
  createRouters
};
