import express from 'express';

import { authenticate } from '../di/di-container.js';
import { tagController } from '../di/di-container.js';
import { API_URLS } from './api.constants.js';

const tagRouter = express.Router();

tagRouter.post(API_URLS.TAG.BASE, authenticate, (req, res, next) => 
  tagController.addTag(req, res, next));

tagRouter.put(API_URLS.TAG.BASE, authenticate, (req, res, next) => 
  tagController.updateTag(req, res, next));

tagRouter.delete(API_URLS.TAG.BASE, authenticate, (req, res, next) => 
  tagController.deleteTag(req, res, next));

export default tagRouter;
