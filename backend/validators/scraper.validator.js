import { z } from 'zod';

// Schema for multi-source scraping
const multiSourceScrapeSchema = z.object({
  sources: z
    .array(z.enum(['unstop', 'internshala', 'apna', 'linkedin']))
    .optional()
    .default(['unstop', 'internshala', 'apna']),
  type: z.enum(['job', 'internship', 'competition']).optional(),
  location: z.string().optional().default(''),
  skills: z.array(z.string()).optional().default([]),
  salary_min: z.number().int().min(0).optional(),
  remote: z.boolean().optional(),
  posted_within_days: z.number().int().min(1).max(365).optional(),
  page: z.number().int().min(1).optional().default(1),
  per_page: z.number().int().min(1).max(100).optional().default(20),
  sort_by: z.enum(['posted_date', 'salary', 'applicants']).optional().default('posted_date'),
});

// Schema for single source scraping
const singleSourceScrapeSchema = z.object({
  type: z
    .enum(['job', 'jobs', 'internship', 'internships', 'competition', 'competitions'])
    .optional()
    .default('internship'),
  location: z.string().optional().default(''),
  category: z.string().optional().default(''),
  page: z.number().int().min(1).optional().default(1),
  pagination: z.number().int().min(1).max(100).optional().default(20),
  roles: z.string().optional(),
  userType: z.string().optional(),
});

export { multiSourceScrapeSchema, singleSourceScrapeSchema };
