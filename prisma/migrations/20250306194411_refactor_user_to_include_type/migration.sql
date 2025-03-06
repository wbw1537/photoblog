/*
  Warnings:

  - You are about to drop the column `admin` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `User` DROP COLUMN `admin`,
    ADD COLUMN `type` ENUM('Admin', 'Normal', 'Pending') NOT NULL DEFAULT 'Pending',
    MODIFY `basePath` VARCHAR(191) NULL;
