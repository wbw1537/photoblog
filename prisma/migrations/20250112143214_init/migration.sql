-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `admin` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Photo` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `liked` BOOLEAN NOT NULL DEFAULT false,
    `iso` INTEGER NULL,
    `exposureTime` VARCHAR(191) NULL,
    `fNumber` DOUBLE NULL,
    `cameraMake` VARCHAR(191) NULL,
    `cameraModel` VARCHAR(191) NULL,
    `lensMake` VARCHAR(191) NULL,
    `lensModel` VARCHAR(191) NULL,
    `focalLength` DOUBLE NULL,
    `focalLength35mm` DOUBLE NULL,
    `dateTaken` DATETIME(3) NULL,
    `timeZone` VARCHAR(191) NULL,
    `gpsLatitude` DOUBLE NULL,
    `gpsLongitude` DOUBLE NULL,
    `gpsTimestamp` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhotoFile` (
    `id` VARCHAR(191) NOT NULL,
    `photoId` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `fileType` VARCHAR(191) NOT NULL,
    `filePath` VARCHAR(191) NOT NULL,
    `fileSize` INTEGER NOT NULL,
    `fileModifiedTime` DATETIME(3) NULL,
    `fileAccessDate` DATETIME(3) NULL,
    `status` ENUM('Main', 'Sub') NOT NULL DEFAULT 'Main',
    `imageHeight` INTEGER NOT NULL,
    `imageWidth` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Photo` ADD CONSTRAINT `Photo_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhotoFile` ADD CONSTRAINT `PhotoFile_photoId_fkey` FOREIGN KEY (`photoId`) REFERENCES `Photo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
