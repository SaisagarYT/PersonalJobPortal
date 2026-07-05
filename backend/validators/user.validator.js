import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  current_position: z.string().max(100).optional(),
  location: z.string().max(100).optional(),
  skills: z.array(z.string().min(1).max(60)).max(50).optional(),
  job_preferences: z
    .object({
      locations: z.array(z.string()).optional(),
      salary_min: z.number().int().min(0).optional(),
      salary_max: z.number().int().min(0).optional(),
      job_types: z.array(z.enum(['full-time', 'part-time', 'contract', 'internship', 'freelance'])).optional(),
      remote_only: z.boolean().optional(),
    })
    .optional(),
});

const updatePreferencesSchema = z.object({
  locations: z.array(z.string()).max(10).optional(),
  salary_min: z.number().int().min(0).optional(),
  salary_max: z.number().int().min(0).optional(),
  job_types: z.array(z.enum(['full-time', 'part-time', 'contract', 'internship', 'freelance'])).optional(),
  remote_only: z.boolean().optional(),
  notification_new_matches: z.boolean().optional(),
  notification_streak_reminders: z.boolean().optional(),
  notification_expiry_alerts: z.boolean().optional(),
});

export { updateProfileSchema, updatePreferencesSchema };
