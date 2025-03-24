/*
  Warnings:

  - Added the required column `orientation` to the `PhotoFile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `PhotoFile` ADD COLUMN `orientation` INTEGER NOT NULL;
