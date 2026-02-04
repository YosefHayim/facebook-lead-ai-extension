import { z } from 'zod';

export const automationRunCompleteSchema = z.object({
  status: z.enum(['running', 'completed', 'failed']),
  groupsScanned: z.number().int().min(0),
  leadsFound: z.number().int().min(0),
  error: z.string().optional(),
});

export const automationRunListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
