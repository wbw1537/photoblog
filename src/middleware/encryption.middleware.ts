import { Request, Response, NextFunction } from 'express';
import crypto from "crypto";
import fs from "fs";

export class EncryptionMiddleware {
  constructor() {
  }

  async encrypt(req: Request, res: Response, next: NextFunction) {
    const originalSend = res.send.bind(res);
    const originalSendFile = res.sendFile.bind(res);

    res.send = (body: unknown): Response => {
      try {
        // Encrypt the response body
        const encrypted = crypto.publicEncrypt(req.body.user.session, Buffer.from(JSON.stringify(body)));
        // Convert the encrypted data to base64
        const encryptedBase64 = encrypted.toString('base64');
        // Set the encrypted data in the response body
        return originalSend(encryptedBase64);
      } catch (error) {
        next(error);
        return res; // Return the response object in case of an error
      }
    };

    res.sendFile = (filePath: string): void => {
      try {
        // Read file contents
        fs.readFile(filePath, (err, data) => {
          if (err) {
            next(err);
            return;
          }
          // Encrypt the file contents
          const encrypted = crypto.publicEncrypt(req.body.user.session, data);
          // Convert the encrypted data to base64
          const encryptedBase64 = encrypted.toString('base64');
          // Send the encrypted data as a response
          originalSendFile(encryptedBase64);
        });
      } catch (error) {
        next(error);
      }
    };

    next();
  }
}