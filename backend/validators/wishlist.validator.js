import { z } from 'zod';

// user_id comes from the verified JWT — only opportunity_id needed in body
const saveWishlistSchema = z.object({
  opportunity_id: z
    .string()
    .min(1, 'Opportunity ID is required')
    .or(z.number().transform((val) => String(val))),
});

const removeWishlistSchema = z.object({
  opportunity_id: z
    .string()
    .min(1, 'Opportunity ID is required')
    .or(z.number().transform((val) => String(val))),
});

// /wishlist/all just returns the user's wishlist — no body fields required
const displayWishlistSchema = z.object({}).passthrough();

export { saveWishlistSchema, removeWishlistSchema, displayWishlistSchema };
