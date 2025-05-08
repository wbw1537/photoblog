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
        const encrypted = crypto
          .createCipheriv('aes-256-cbc', req.body.user.session, Buffer.alloc(16, 0))
          .update(JSON.stringify(body), 'utf8', 'hex');
        // Convert the encrypted data to base64
        const encryptedBase64 = encrypted.toString();
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
          const encrypted = crypto
          .createCipheriv('aes-256-cbc', req.body.user.session, Buffer.alloc(16, 0))
          .update(JSON.stringify(data), 'utf8', 'hex');
          // Convert the encrypted data to base64
          const encryptedBase64 = encrypted.toString();
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