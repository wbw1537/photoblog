/*
  Warnings:

  - You are about to drop the column `gpsLatitude` on the `Photo` table. All the data in the column will be lost.
  - You are about to drop the column `gpsLongitude` on the `Photo` table. All the data in the column will be lost.
  - You are about to drop the column `gpsTimestamp` on the `Photo` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PreviewStatus" AS ENUM ('Pending', 'Processing', 'Ready', 'Failed');

-- DropForeignKey
ALTER TABLE "public"."PhotoFile" DROP CONSTRAINT "PhotoFile_photoId_fkey";

-- AlterTable
ALTER TABLE "Photo" DROP COLUMN "gpsLatitude",
DROP COLUMN "gpsLongitude",
DROP COLUMN "gpsTimestamp";

-- AlterTable
ALTER TABLE "PhotoFile" ADD COLUMN     "previewError" TEXT,
ADD COLUMN     "previewPath" TEXT,
ADD COLUMN     "previewStatus" "PreviewStatus" NOT NULL DEFAULT 'Pending';

-- CreateTable
CREATE TABLE "PhotoLocation" (
    "id" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "altitude" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3),
    "country" TEXT,
    "city" TEXT,
    "placeName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhotoLocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PhotoLocation_photoId_key" ON "PhotoLocation"("photoId");

-- CreateIndex
CREATE INDEX "PhotoLocation_latitude_longitude_idx" ON "PhotoLocation"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "PhotoLocation_country_idx" ON "PhotoLocation"("country");

-- CreateIndex
CREATE INDEX "PhotoLocation_city_idx" ON "PhotoLocation"("city");

-- CreateIndex
CREATE INDEX "Photo_userId_idx" ON "Photo"("userId");

-- CreateIndex
CREATE INDEX "Photo_dateTaken_idx" ON "Photo"("dateTaken");

-- CreateIndex
CREATE INDEX "PhotoFile_photoId_idx" ON "PhotoFile"("photoId");

-- CreateIndex
CREATE INDEX "PhotoFile_previewStatus_idx" ON "PhotoFile"("previewStatus");

-- AddForeignKey
ALTER TABLE "PhotoFile" ADD CONSTRAINT "PhotoFile_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Photo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoLocation" ADD CONSTRAINT "PhotoLocation_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Photo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
