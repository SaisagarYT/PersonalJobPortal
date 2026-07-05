import express from 'express';
import userController from '../controllers/user.controller.js';
import { validate } from '../middleware/validate.js';
import { updateProfileSchema, updatePreferencesSchema } from '../validators/user.validator.js';
import requireAuth from '../middleware/auth.js';
import { apiLimiter, writeLimiter } from '../middleware/security.js';

const router = express.Router();

// All user routes require auth
router.use(requireAuth);

// GET  /api/v1/user/profile
router.get('/user/profile', apiLimiter, userController.getProfile);

// PATCH /api/v1/user/profile
router.patch('/user/profile', writeLimiter, validate(updateProfileSchema), userController.updateProfile);

// PATCH /api/v1/settings/preferences
router.patch('/settings/preferences', writeLimiter, validate(updatePreferencesSchema), userController.updatePreferences);

export default router;
