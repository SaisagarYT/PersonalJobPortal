import { z } from 'zod';

const STAGES = ['saved', 'applied', 'interview', 'offer', 'rejected'];

const createApplicationSchema = z.object({
  opportunity_id: z.number().int().positive(),
  stage: z.enum(STAGES).default('saved'),
  notes: z.string().max(2000).optional(),
  resume_id: z.number().int().positive().optional(),
});

const updateStageSchema = z.object({
  stage: z.enum(STAGES),
});

const updateApplicationSchema = z.object({
  notes: z.string().max(2000).optional(),
  resume_id: z.number().int().positive().nullable().optional(),
  applied_at: z.string().datetime().optional(),
});

const createInterviewRoundSchema = z.object({
  round_name: z.string().min(1).max(100),
  scheduled_at: z.string().datetime().optional(),
  status: z.enum(['pending', 'completed', 'cancelled']).default('pending'),
  notes: z.string().max(2000).optional(),
});

const updateInterviewRoundSchema = z.object({
  round_name: z.string().min(1).max(100).optional(),
  scheduled_at: z.string().datetime().nullable().optional(),
  status: z.enum(['pending', 'completed', 'cancelled']).optional(),
  notes: z.string().max(2000).optional(),
});

export {
  createApplicationSchema,
  updateStageSchema,
  updateApplicationSchema,
  createInterviewRoundSchema,
  updateInterviewRoundSchema,
};
