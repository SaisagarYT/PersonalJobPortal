import express from 'express';
import applicationController from '../controllers/application.controller.js';
import { validate } from '../middleware/validate.js';
import {
  createApplicationSchema,
  updateStageSchema,
  updateApplicationSchema,
  createInterviewRoundSchema,
  updateInterviewRoundSchema,
} from '../validators/application.validator.js';
import requireAuth from '../middleware/auth.js';
import { apiLimiter, writeLimiter } from '../middleware/security.js';

const router = express.Router();

router.use(requireAuth);

// GET  /api/v1/applications          — all applications + kanban summary
router.get('/applications', apiLimiter, applicationController.getApplications);

// GET  /api/v1/applications/:id      — single application with rounds
router.get('/applications/:id', apiLimiter, applicationController.getApplicationById);

// POST /api/v1/applications          — create (save a job to pipeline)
router.post('/applications', writeLimiter, validate(createApplicationSchema), applicationController.createApplication);

// PATCH /api/v1/applications/:id/stage  — move kanban card
router.patch('/applications/:id/stage', writeLimiter, validate(updateStageSchema), applicationController.updateStage);

// PATCH /api/v1/applications/:id     — update notes / resume
router.patch('/applications/:id', writeLimiter, validate(updateApplicationSchema), applicationController.updateApplication);

// DELETE /api/v1/applications/:id
router.delete('/applications/:id', writeLimiter, applicationController.deleteApplication);

// ── Interview rounds ──────────────────────────────────────────────────────────

// POST   /api/v1/applications/:id/rounds
router.post('/applications/:id/rounds', writeLimiter, validate(createInterviewRoundSchema), applicationController.addInterviewRound);

// PATCH  /api/v1/applications/:id/rounds/:round_id
router.patch('/applications/:id/rounds/:round_id', writeLimiter, validate(updateInterviewRoundSchema), applicationController.updateInterviewRound);

// DELETE /api/v1/applications/:id/rounds/:round_id
router.delete('/applications/:id/rounds/:round_id', writeLimiter, applicationController.deleteInterviewRound);

export default router;
