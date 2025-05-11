-- AlterTable
ALTER TABLE `Blog` MODIFY `content` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `SharedUser` MODIFY `sharedUserTempSymmetricKey` VARCHAR(2048) NOT NULL,
    MODIFY `sharedUserPublicKey` VARCHAR(2048) NOT NULL,
    MODIFY `accessToken` VARCHAR(2048) NULL,
    MODIFY `session` VARCHAR(2048) NULL;

-- AlterTable
ALTER TABLE `User` MODIFY `privateKey` VARCHAR(2048) NOT NULL,
    MODIFY `publicKey` VARCHAR(2048) NOT NULL;
