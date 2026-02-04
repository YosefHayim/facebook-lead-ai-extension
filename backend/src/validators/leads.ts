import { z } from 'zod';

export const leadStatusSchema = z.enum(['new', 'contacted', 'converted', 'ignored']);
export const intentSchema = z.enum([
  'seeking_service',
  'hiring',
  'complaining',
  'recommendation',
  'discussion',
  'selling',
  'irrelevant',
]);

export const leadListQuerySchema = z.object({
  status: leadStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  skip: z.coerce.number().int().min(0).default(0),
});

export const leadCreateSchema = z.object({
  postUrl: z.string().url(),
  postText: z.string().min(1),
  authorName: z.string().min(1),
  authorProfileUrl: z.string().url(),
  groupName: z.string().min(1).optional(),
  intent: intentSchema,
  leadScore: z.number().int().min(0).max(100),
  aiAnalysis: z
    .object({
      intent: intentSchema,
      confidence: z.number().min(0).max(1),
      reasoning: z.string().min(1),
      keywords: z.array(z.string()).default([]),
    })
    .optional(),
  aiDraftReply: z.string().optional(),
});

export const leadBulkSchema = z.object({
  leads: z.array(leadCreateSchema).min(1),
});

export const leadUpdateSchema = z.object({
  status: leadStatusSchema.optional(),
  aiDraftReply: z.string().optional(),
  responseTracking: z
    .object({
      responded: z.boolean().optional(),
      responseText: z.string().optional(),
      respondedAt: z.string().datetime().optional(),
      gotReply: z.boolean().optional(),
      repliedAt: z.string().datetime().optional(),
    })
    .optional(),
});
