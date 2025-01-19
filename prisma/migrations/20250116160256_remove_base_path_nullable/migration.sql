/*
  Warnings:

  - Made the column `basePath` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `User` MODIFY `basePath` VARCHAR(191) NOT NULL;
