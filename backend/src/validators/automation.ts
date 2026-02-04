import { z } from 'zod';

export const automationSettingsUpdateSchema = z.object({
  enabled: z.boolean().optional(),
  scanIntervalMinutes: z.number().int().min(5).max(1440).optional(),
  groupsPerCycle: z.number().int().min(1).max(20).optional(),
  delayMinSeconds: z.number().int().min(1).optional(),
  delayMaxSeconds: z.number().int().min(5).optional(),
  lastScanAt: z.string().datetime().optional(),
});
