import { Router } from 'express';
import { AutomationSettings } from '../models/AutomationSettings.js';
import { requireAuth } from '../middleware/auth.js';
import type { AuthenticatedRequest, ApiResponse } from '../types/index.js';

const router = Router();

router.use(requireAuth);

router.get('/settings', async (req: AuthenticatedRequest, res) => {
  try {
    const settings = await AutomationSettings.findOrCreate(req.user!.dbUserId);

    res.json({
      success: true,
      data: { settings },
    } as ApiResponse);
  } catch (error) {
    console.error('[Automation] Get settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch automation settings',
    } as ApiResponse);
  }
});

router.patch('/settings', async (req: AuthenticatedRequest, res) => {
  try {
    let settings = await AutomationSettings.findByUserId(req.user!.dbUserId);

    if (!settings) {
      settings = await AutomationSettings.create({
        userId: req.user!.dbUserId,
        ...req.body,
      });
    } else {
      Object.assign(settings, req.body);
      await settings.save();
    }

    res.json({
      success: true,
      data: { settings },
    } as ApiResponse);
  } catch (error) {
    console.error('[Automation] Update settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update automation settings',
    } as ApiResponse);
  }
});

router.post('/scan-complete', async (req: AuthenticatedRequest, res) => {
  try {
    await AutomationSettings.updateLastScan(req.user!.dbUserId);

    res.json({
      success: true,
      message: 'Scan recorded',
    } as ApiResponse);
  } catch (error) {
    console.error('[Automation] Record scan error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record scan',
    } as ApiResponse);
  }
});

export default router;
