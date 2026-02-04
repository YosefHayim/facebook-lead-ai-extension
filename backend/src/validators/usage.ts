import { z } from 'zod';

export const usageTypeSchema = z.enum(['leads', 'aiCalls']);

export const usageIncrementSchema = z.object({
  type: usageTypeSchema,
  amount: z.number().int().min(1).optional(),
});

export const usageCheckSchema = z.object({
  type: usageTypeSchema,
});
