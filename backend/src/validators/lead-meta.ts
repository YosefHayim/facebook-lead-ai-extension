import { z } from 'zod';

export const leadFeedbackCreateSchema = z.object({
  quality: z.enum(['good', 'bad', 'neutral']),
  reason: z.string().optional(),
});

export const leadContextUpsertSchema = z.object({
  lci: z.record(z.unknown()),
  confidenceScore: z.number().int().min(0).max(100),
  fetchedAt: z.string().datetime().optional(),
});

export const leadNoteCreateSchema = z.object({
  note: z.string().min(1),
});

export const leadTagAddSchema = z.object({
  tags: z.array(z.string().min(1)).min(1),
});
