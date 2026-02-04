import { z } from 'zod';

export const groupCreateSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  category: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const groupUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  url: z.string().url().optional(),
  category: z.string().optional(),
  lastVisited: z.string().datetime().optional(),
  leadsFound: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const groupVisitSchema = z.object({
  leadsFound: z.number().int().min(0).optional(),
});
