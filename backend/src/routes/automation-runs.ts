import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import type { AuthenticatedRequest, ApiResponse } from '../types/index.js';
import { automationRunCompleteSchema, automationRunListQuerySchema } from '../validators/automation-runs.js';
import { completeAutomationRun, createAutomationRun, listAutomationRuns } from '../services/automation-runs.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (req: AuthenticatedRequest, res) => {
  const parsed = automationRunListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid query parameters',
    } as ApiResponse);
  }

  try {
    const runs = await listAutomationRuns(req.user!.dbUserId, parsed.data.limit);
    res.json({ success: true, data: { runs } } as ApiResponse);
  } catch (error) {
    console.error('[AutomationRuns] List error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch automation runs',
    } as ApiResponse);
  }
});

router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const run = await createAutomationRun(req.user!.dbUserId);
    res.status(201).json({ success: true, data: { run } } as ApiResponse);
  } catch (error) {
    console.error('[AutomationRuns] Create error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create automation run',
    } as ApiResponse);
  }
});

router.patch('/:id', async (req: AuthenticatedRequest, res) => {
  const parsed = automationRunCompleteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid automation run payload',
    } as ApiResponse);
  }

  try {
    const run = await completeAutomationRun(req.user!.dbUserId, req.params.id, parsed.data);
    if (!run) {
      return res.status(404).json({
        success: false,
        error: 'Automation run not found',
      } as ApiResponse);
    }

    res.json({ success: true, data: { run } } as ApiResponse);
  } catch (error) {
    console.error('[AutomationRuns] Complete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update automation run',
    } as ApiResponse);
  }
});

export default router;
