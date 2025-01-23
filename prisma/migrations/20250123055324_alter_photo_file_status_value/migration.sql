/*
  Warnings:

  - You are about to alter the column `status` on the `PhotoFile` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(0))` to `Enum(EnumId(0))`.

*/
-- AlterTable
ALTER TABLE `PhotoFile` MODIFY `status` ENUM('Source', 'Offshoot') NOT NULL DEFAULT 'Source';
