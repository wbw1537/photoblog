-- CreateEnum
CREATE TYPE "PhotoFileStatus" AS ENUM ('Source', 'Offshoot');

-- CreateEnum
CREATE TYPE "BlogType" AS ENUM ('Article', 'PhotoPost');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('Photo', 'PhotoFile');

-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('Admin', 'Normal', 'Pending', 'Remote');

-- CreateEnum
CREATE TYPE "RemoteUserStatus" AS ENUM ('Pending', 'Active', 'Blocked');

-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('Share', 'Block');

-- CreateEnum
CREATE TYPE "RelationshipStatus" AS ENUM ('Pending', 'Active', 'Blocked');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "type" "UserType" NOT NULL DEFAULT 'Pending',
    "instanceUrl" TEXT NOT NULL DEFAULT '**PLACEHOLDER**',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocalUser" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "basePath" TEXT NOT NULL DEFAULT '**PLACEHOLDER**',
    "cachePath" TEXT NOT NULL DEFAULT '**PLACEHOLDER**',
    "publicKey" VARCHAR(2048) NOT NULL,
    "privateKey" VARCHAR(2048) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocalUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "liked" BOOLEAN NOT NULL DEFAULT false,
    "iso" INTEGER,
    "exposureTime" DOUBLE PRECISION,
    "exposureTimeValue" TEXT,
    "fNumber" DOUBLE PRECISION,
    "cameraMake" TEXT,
    "cameraModel" TEXT,
    "lensMake" TEXT,
    "lensModel" TEXT,
    "focalLength" DOUBLE PRECISION,
    "focalLength35mm" DOUBLE PRECISION,
    "dateTaken" TIMESTAMP(3),
    "timeZone" TEXT,
    "gpsLatitude" DOUBLE PRECISION,
    "gpsLongitude" DOUBLE PRECISION,
    "gpsTimestamp" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhotoFile" (
    "id" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileModifiedTime" TIMESTAMP(3),
    "fileAccessDate" TIMESTAMP(3),
    "status" "PhotoFileStatus" NOT NULL DEFAULT 'Source',
    "imageHeight" INTEGER NOT NULL,
    "imageWidth" INTEGER NOT NULL,
    "orientation" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhotoFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Blog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "blogType" "BlogType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Blog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogMedia" (
    "id" TEXT NOT NULL,
    "blogId" TEXT NOT NULL,
    "mediaType" "MediaType" NOT NULL,
    "mediaId" TEXT NOT NULL,
    "mediaPosition" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhotoTag" (
    "photoId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "PhotoTag_pkey" PRIMARY KEY ("photoId","tagId")
);

-- CreateTable
CREATE TABLE "BlogTag" (
    "blogId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "BlogTag_pkey" PRIMARY KEY ("blogId","tagId")
);

-- CreateTable
CREATE TABLE "RemoteUser" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "instanceUrl" TEXT NOT NULL,
    "publicKey" VARCHAR(2048),
    "tempSymmetricKey" VARCHAR(2048),
    "accessToken" VARCHAR(2048),
    "accessTokenExpireTime" TIMESTAMP(3),
    "session" VARCHAR(2048),
    "status" "RemoteUserStatus" NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RemoteUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRelationship" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "relationshipType" "RelationshipType" NOT NULL,
    "status" "RelationshipStatus" NOT NULL DEFAULT 'Pending',
    "permissions" JSONB,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "LocalUser_userId_key" ON "LocalUser"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PhotoFile_filePath_key" ON "PhotoFile"("filePath");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RemoteUser_userId_key" ON "RemoteUser"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRelationship_fromUserId_toUserId_key" ON "UserRelationship"("fromUserId", "toUserId");

-- AddForeignKey
ALTER TABLE "LocalUser" ADD CONSTRAINT "LocalUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoFile" ADD CONSTRAINT "PhotoFile_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Photo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Blog" ADD CONSTRAINT "Blog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogMedia" ADD CONSTRAINT "BlogMedia_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "Blog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoTag" ADD CONSTRAINT "PhotoTag_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Photo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoTag" ADD CONSTRAINT "PhotoTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogTag" ADD CONSTRAINT "BlogTag_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "Blog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogTag" ADD CONSTRAINT "BlogTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemoteUser" ADD CONSTRAINT "RemoteUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRelationship" ADD CONSTRAINT "UserRelationship_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRelationship" ADD CONSTRAINT "UserRelationship_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
