import express from 'express';
import { authenticate } from '../di/di-container.js';
import { API_URLS } from './api.constants.js';

import { sharedUserController } from '../di/di-container.js';

const sharedUserRouter = express.Router();

// Get all relationships for the current user
sharedUserRouter.get(API_URLS.SHARED_USER.BASE, authenticate, (req, res, next) => 
  sharedUserController.getRelationships(req, res, next));

// Fetch public user info from a remote instance
sharedUserRouter.get(API_URLS.SHARED_USER.FETCH_REMOTE, authenticate, (req, res, next) => 
  sharedUserController.fetchRemoteUsers(req, res, next));

// Initiate a relationship with a remote user
sharedUserRouter.post(API_URLS.SHARED_USER.INIT, authenticate, (req, res, next) => 
  sharedUserController.initiateRemoteRelationship(req, res, next));

// Approve a pending incoming relationship
sharedUserRouter.post(API_URLS.SHARED_USER.APPROVE, authenticate, (req, res, next) => 
  sharedUserController.approveRelationship(req, res, next));

// Block an active relationship
sharedUserRouter.post(API_URLS.SHARED_USER.BLOCK, authenticate, (req, res, next) =>
  sharedUserController.blockRelationship(req, res, next));

// Proxy a request to a remote user's instance
sharedUserRouter.post(API_URLS.SHARED_USER.REQUEST, authenticate, (req, res, next) =>
  sharedUserController.proxyRequestToRemote(req, res, next));

// --- Public routes for inter-instance communication ---

// Endpoint for a remote instance to initiate a relationship with a local user
sharedUserRouter.post(API_URLS.SHARED_USER.PUBLIC_INIT, (req, res, next) => 
  sharedUserController.receiveRemoteRelationshipRequest(req, res, next));

// Endpoint for the key exchange part of the handshake
sharedUserRouter.post(API_URLS.SHARED_USER.PUBLIC_EXCHANGE, (req, res, next) => 
  sharedUserController.exchangeRemotePublicKey(req, res, next));

// Endpoint for the signature validation part of the handshake
sharedUserRouter.post(API_URLS.SHARED_USER.PUBLIC_VALIDATE, (req, res, next) => 
  sharedUserController.validateRemotePublicKey(req, res, next));

// Endpoint for a remote user to get a session token
sharedUserRouter.post(API_URLS.SHARED_USER.PUBLIC_SESSION, (req, res, next) => 
  sharedUserController.getSession(req, res, next));

export default sharedUserRouter;