import { z } from 'zod';

export const scanRunCreateSchema = z.object({
  source: z.enum(['manual', 'auto']),
  groupId: z.string().uuid().optional(),
  groupName: z.string().optional(),
});

export const scanRunCompleteSchema = z.object({
  postsFound: z.number().int().min(0),
  leadsDetected: z.number().int().min(0),
  errors: z.record(z.unknown()).optional().nullable(),
});

export const scanRunListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
