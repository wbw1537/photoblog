/*
  Warnings:

  - A unique constraint covering the columns `[filePath]` on the table `PhotoFile` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fileHash` to the `PhotoFile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `PhotoFile` ADD COLUMN `fileHash` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `basePath` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `PhotoFile_filePath_key` ON `PhotoFile`(`filePath`);
