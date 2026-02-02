import { Router } from 'express';
import { User } from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import type { AuthenticatedRequest, ApiResponse } from '../types/index.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const user = await User.findById(req.user!.dbUserId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: {
        usage: user.usage,
        limits: user.limits,
        plan: user.subscription.plan,
      },
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
  try {
    const { type, amount = 1 } = req.body as { type: 'leads' | 'aiCalls'; amount?: number };

    if (!type || !['leads', 'aiCalls'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid usage type',
      } as ApiResponse);
    }

    const user = await User.findById(req.user!.dbUserId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      } as ApiResponse);
    }

    if (!User.isWithinLimits(user, type)) {
      return res.status(403).json({
        success: false,
        error: `Monthly ${type} limit reached`,
      } as ApiResponse);
    }

    await User.incrementUsage(user.id, type, amount);
    
    const updatedUser = await User.findById(user.id);

    res.json({
      success: true,
      data: {
        usage: updatedUser?.usage,
        limits: updatedUser?.limits,
      },
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
  try {
    const { type } = req.body as { type: 'leads' | 'aiCalls' };

    if (!type || !['leads', 'aiCalls'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid usage type',
      } as ApiResponse);
    }

    const user = await User.findById(req.user!.dbUserId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      } as ApiResponse);
    }

    const withinLimits = User.isWithinLimits(user, type);
    const current = type === 'leads' ? user.usage.leadsFoundThisMonth : user.usage.aiCallsThisMonth;
    const limit = type === 'leads' ? user.limits.leadsPerMonth : user.limits.aiCallsPerMonth;

    res.json({
      success: true,
      data: {
        allowed: withinLimits,
        current,
        limit,
        remaining: Math.max(0, limit - current),
      },
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
