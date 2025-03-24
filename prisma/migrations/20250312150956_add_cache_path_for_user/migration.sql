/*
  Warnings:

  - A unique constraint covering the columns `[basePath]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cachePath]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `User` ADD COLUMN `cachePath` VARCHAR(191) NOT NULL DEFAULT '**PLACEHOLDER**',
    MODIFY `basePath` VARCHAR(191) NOT NULL DEFAULT '**PLACEHOLDER**';
