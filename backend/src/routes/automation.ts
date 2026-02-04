import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import type { AuthenticatedRequest, ApiResponse } from '../types/index.js';
import { automationSettingsUpdateSchema } from '../validators/automation.js';
import { getAutomationSettings, recordScanComplete, updateAutomationSettings } from '../services/automation.js';

const router = Router();

router.use(requireAuth);

router.get('/settings', async (req: AuthenticatedRequest, res) => {
  try {
    const settings = await getAutomationSettings(req.user!.dbUserId);

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
  const parsed = automationSettingsUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid automation settings payload',
    } as ApiResponse);
  }

  try {
    const updates = parsed.data;
    const settings = await updateAutomationSettings(req.user!.dbUserId, {
      ...updates,
      lastScanAt: updates.lastScanAt ? new Date(updates.lastScanAt) : undefined,
    });

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
    await recordScanComplete(req.user!.dbUserId);

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
