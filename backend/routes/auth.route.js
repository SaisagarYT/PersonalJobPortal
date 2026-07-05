import express from 'express';
import authController from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { signupSchema, loginSchema } from '../validators/auth.validator.js';
import { authLimiter } from '../middleware/security.js';
import requireAuth from '../middleware/auth.js';

const router = express.Router();

// POST /api/v1/auth/signup
router.post('/auth/signup', authLimiter, validate(signupSchema), authController.signup);

// POST /api/v1/auth/login
router.post('/auth/login', authLimiter, validate(loginSchema), authController.login);

// POST /api/v1/auth/logout  (requires valid token)
router.post('/auth/logout', requireAuth, authController.logout);

// GET /api/v1/auth/me  (requires valid token)
router.get('/auth/me', requireAuth, authController.me);

export default router;
