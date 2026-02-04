import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import type { AuthenticatedRequest, ApiResponse } from '../types/index.js';
import { usageCheckSchema, usageIncrementSchema } from '../validators/usage.js';
import { checkUsageLimit, getUsage, incrementUsage } from '../services/usage.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const data = await getUsage(req.user!.dbUserId);

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      } as ApiResponse);
    }

    res.json({
      success: true,
      data,
    } as ApiResponse);
  } catch (error) {
    console.error('[Usage] Get error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch usage',
    } as ApiResponse);
  }
});

router.post('/increment', async (req: AuthenticatedRequest, res) => {
  const parsed = usageIncrementSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid usage payload',
    } as ApiResponse);
  }

  try {
    const result = await incrementUsage(req.user!.dbUserId, parsed.data.type, parsed.data.amount ?? 1);

    if ('error' in result) {
      const status = result.error === 'User not found' ? 404 : 403;
      return res.status(status).json({
        success: false,
        error: result.error,
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: result,
    } as ApiResponse);
  } catch (error) {
    console.error('[Usage] Increment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to increment usage',
    } as ApiResponse);
  }
});

router.post('/check', async (req: AuthenticatedRequest, res) => {
  const parsed = usageCheckSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid usage payload',
    } as ApiResponse);
  }

  try {
    const data = await checkUsageLimit(req.user!.dbUserId, parsed.data.type);

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      } as ApiResponse);
    }

    res.json({
      success: true,
      data,
    } as ApiResponse);
  } catch (error) {
    console.error('[Usage] Check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check usage',
    } as ApiResponse);
  }
});

export default router;
