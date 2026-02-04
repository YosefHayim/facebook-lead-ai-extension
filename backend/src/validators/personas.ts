import { z } from 'zod';

export const aiToneSchema = z.enum(['professional', 'casual', 'friendly', 'expert']);

export const personaCreateSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  keywords: z.array(z.string()).optional(),
  negativeKeywords: z.array(z.string()).optional(),
  aiTone: aiToneSchema.optional(),
  valueProposition: z.string().min(1),
  signature: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const personaUpdateSchema = personaCreateSchema.partial();
