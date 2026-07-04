import express from 'express';
import wishlistController from '../controllers/wishlist.controller.js';
import { validate } from '../middleware/validate.js';
import {
  saveWishlistSchema,
  removeWishlistSchema,
  displayWishlistSchema,
} from '../validators/wishlist.validator.js';
import { writeLimiter, scrapeLimiter } from '../middleware/security.js';

const route = express.Router();

// Add to wishlist - write limiter (20 req/min)
route.post(
  '/wishlist',
  writeLimiter,
  validate(saveWishlistSchema),
  wishlistController.wishlistSaveController
);

// Remove from wishlist - write limiter (20 req/min)
route.delete(
  '/wishlist',
  writeLimiter,
  validate(removeWishlistSchema),
  wishlistController.wishlistRemoveController
);

// Display wishlist - scrape limiter (10 req/min) since it scrapes Unstop
route.post(
  '/wishlist/all',
  scrapeLimiter,
  validate(displayWishlistSchema),
  wishlistController.wishlistDisplayController
);

export default route;
