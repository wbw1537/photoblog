/*
  Warnings:

  - Added the required column `privateKey` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `publicKey` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `User` ADD COLUMN `address` VARCHAR(191) NOT NULL DEFAULT '**PLACEHOLDER**',
    ADD COLUMN `privateKey` VARCHAR(191) NOT NULL,
    ADD COLUMN `publicKey` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `SharedUser` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `comment` VARCHAR(191) NOT NULL,
    `sharedUserId` VARCHAR(191) NOT NULL,
    `sharedUserEmail` VARCHAR(191) NOT NULL,
    `sharedUserName` VARCHAR(191) NOT NULL,
    `sharedUserAddress` VARCHAR(191) NOT NULL,
    `status` ENUM('Pending', 'Active', 'Blocked') NOT NULL,
    `direction` ENUM('Incoming', 'Outgoing') NOT NULL,
    `sharedUserTempSymmetricKey` VARCHAR(191) NOT NULL,
    `sharedUserPublicKey` VARCHAR(191) NOT NULL,
    `accessToken` VARCHAR(191) NULL,
    `accessTokenExpireTime` DATETIME(3) NULL,
    `session` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SharedUser` ADD CONSTRAINT `SharedUser_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
