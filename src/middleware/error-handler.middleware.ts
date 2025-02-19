import { Request, Response } from 'express';
import log4js from 'log4js';

import { PhotoBlogError } from '../errors/photoblog.error.js';

const logger = log4js.getLogger();

export const errorHandler = (
  err: Error | PhotoBlogError,
  req: Request,
  res: Response,
) => {
  if (err instanceof PhotoBlogError) {
    logger.error(err.message);
    return res.status(err.statusCode).json({
      message: err.message
    });
  }

  // Handle other errors
  logger.error("Other error occurred:", err);
  res.status(500).json({
    message: 'Internal server error',
  });
};