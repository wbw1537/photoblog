/*
  Warnings:

  - You are about to drop the column `address` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `basePath` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `cachePath` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `privateKey` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `publicKey` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `SharedUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `SharedUser` DROP FOREIGN KEY `SharedUser_userId_fkey`;

-- AlterTable
ALTER TABLE `User` DROP COLUMN `address`,
    DROP COLUMN `basePath`,
    DROP COLUMN `cachePath`,
    DROP COLUMN `password`,
    DROP COLUMN `privateKey`,
    DROP COLUMN `publicKey`,
    ADD COLUMN `instanceUrl` VARCHAR(191) NOT NULL DEFAULT '**PLACEHOLDER**',
    MODIFY `type` ENUM('Admin', 'Normal', 'Pending', 'Remote') NOT NULL DEFAULT 'Pending';

-- DropTable
DROP TABLE `SharedUser`;

-- CreateTable
CREATE TABLE `LocalUser` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `basePath` VARCHAR(191) NOT NULL DEFAULT '**PLACEHOLDER**',
    `cachePath` VARCHAR(191) NOT NULL DEFAULT '**PLACEHOLDER**',
    `publicKey` VARCHAR(2048) NOT NULL,
    `privateKey` VARCHAR(2048) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `LocalUser_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RemoteUser` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `instanceUrl` VARCHAR(191) NOT NULL,
    `publicKey` VARCHAR(2048) NOT NULL,
    `tempSymmetricKey` VARCHAR(2048) NULL,
    `accessToken` VARCHAR(2048) NULL,
    `accessTokenExpireTime` DATETIME(3) NULL,
    `session` VARCHAR(2048) NULL,
    `status` ENUM('Pending', 'Active', 'Blocked') NOT NULL DEFAULT 'Pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `RemoteUser_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserRelationship` (
    `id` VARCHAR(191) NOT NULL,
    `fromUserId` VARCHAR(191) NOT NULL,
    `toUserId` VARCHAR(191) NOT NULL,
    `relationshipType` ENUM('Share', 'Block') NOT NULL,
    `status` ENUM('Pending', 'Active', 'Blocked') NOT NULL DEFAULT 'Pending',
    `permissions` JSON NULL,
    `comment` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `UserRelationship_fromUserId_toUserId_key`(`fromUserId`, `toUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LocalUser` ADD CONSTRAINT `LocalUser_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RemoteUser` ADD CONSTRAINT `RemoteUser_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserRelationship` ADD CONSTRAINT `UserRelationship_fromUserId_fkey` FOREIGN KEY (`fromUserId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserRelationship` ADD CONSTRAINT `UserRelationship_toUserId_fkey` FOREIGN KEY (`toUserId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
