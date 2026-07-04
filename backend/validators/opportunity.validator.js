import { z } from 'zod';

// Schema for fetching opportunities
const fetchOpportunitiesSchema = z.object({
  page: z
    .number()
    .int()
    .positive()
    .optional()
    .default(1)
    .or(z.string().transform((val) => parseInt(val, 10)))
    .transform((val) => (typeof val === 'string' ? parseInt(val, 10) : val)),
  pagination: z
    .number()
    .int()
    .positive()
    .max(100)
    .optional()
    .default(18)
    .or(z.string().transform((val) => parseInt(val, 10)))
    .transform((val) => (typeof val === 'string' ? parseInt(val, 10) : val)),
  role: z.string().min(1).optional().default('ai-engineer'),
  userType: z.string().min(1).optional().default('students'),
});

// Schema for company info
const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  logo: z.string().url().optional().or(z.literal('')),
});

// Schema for work/job functions
const workSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  description: z.string().optional(),
  created_at: z.string().optional(),
});

// Schema for filters
const filterSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  type: z.string().optional(),
});

// Schema for skills
const skillSchema = z.object({
  id: z.number().int(),
  skill: z.string(),
});

// Schema for location
const locationSchema = z.object({
  id: z.number().int(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
});

// Schema for job details
const jobDetailSchema = z.object({
  max_salary: z.number().int().optional(),
  currency: z.string().optional(),
});

// Schema for saving opportunities to history
const saveOpportunitySchema = z.object({
  external_id: z.union([z.string(), z.number()]).transform((val) => String(val)),
  title: z.string().min(1, 'Title is required'),
  short_url: z.string().url().optional().or(z.literal('')),
  company: companySchema,
  description: z.string().optional().default(''),
  status: z.string().optional(),
  work: z.array(workSchema).optional().default([]),
  filters: z
    .object({
      name: z.array(filterSchema).optional(),
    })
    .optional()
    .default({ name: [] }),
  skills: z.array(skillSchema).optional().default([]),
  location: z.array(locationSchema).optional().default([]),
  job_detail: jobDetailSchema.optional().default({}),
  type: z.string().optional(),
  timing: z.string().optional(),
  payment_type: z.string().optional(),
  end_date: z.string().optional(),
  approved_date: z.string().optional(),
  register_count: z.number().int().optional(),
});

export { fetchOpportunitiesSchema, saveOpportunitySchema };
