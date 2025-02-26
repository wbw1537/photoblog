/*
  Warnings:

  - You are about to alter the column `exposureTime` on the `Photo` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Double`.

*/
-- AlterTable
ALTER TABLE `Photo` ADD COLUMN `exposureTimeValue` VARCHAR(191) NULL,
    MODIFY `exposureTime` DOUBLE NULL;
