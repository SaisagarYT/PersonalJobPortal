import { z } from 'zod';

// Schema for saving to wishlist
const saveWishlistSchema = z.object({
  user_id: z
    .string()
    .min(1, 'User ID is required')
    .or(z.number().transform((val) => String(val))),
  opportunity_id: z
    .string()
    .min(1, 'Opportunity ID is required')
    .or(z.number().transform((val) => String(val))),
});

// Schema for removing from wishlist
const removeWishlistSchema = z.object({
  user_id: z
    .string()
    .min(1, 'User ID is required')
    .or(z.number().transform((val) => String(val))),
  opportunity_id: z
    .string()
    .min(1, 'Opportunity ID is required')
    .or(z.number().transform((val) => String(val))),
});

// Schema for displaying wishlist
const displayWishlistSchema = z.object({
  id: z
    .string()
    .min(1, 'Opportunity ID is required')
    .or(z.number().transform((val) => String(val))),
});

export { saveWishlistSchema, removeWishlistSchema, displayWishlistSchema };
