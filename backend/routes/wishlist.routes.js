import express from 'express';
import wishlistController from '../controllers/wishlist.controller.js';
import { validate } from '../middleware/validate.js';
import {
  saveWishlistSchema,
  removeWishlistSchema,
  displayWishlistSchema,
} from '../validators/wishlist.validator.js';
import { writeLimiter, scrapeLimiter } from '../middleware/security.js';
import requireAuth from '../middleware/auth.js';

const route = express.Router();

// All wishlist routes require a valid JWT
route.post(
  '/wishlist',
  requireAuth,
  writeLimiter,
  validate(saveWishlistSchema),
  wishlistController.wishlistSaveController
);

route.delete(
  '/wishlist',
  requireAuth,
  writeLimiter,
  validate(removeWishlistSchema),
  wishlistController.wishlistRemoveController
);

route.post(
  '/wishlist/all',
  requireAuth,
  scrapeLimiter,
  validate(displayWishlistSchema),
  wishlistController.wishlistDisplayController
);

export default route;
