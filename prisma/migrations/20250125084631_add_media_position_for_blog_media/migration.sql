/*
  Warnings:

  - Added the required column `mediaPosition` to the `BlogMedia` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `BlogMedia` ADD COLUMN `mediaPosition` INTEGER NOT NULL;
