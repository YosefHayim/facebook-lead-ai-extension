import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import type { AuthenticatedRequest, ApiResponse } from '../types/index.js';
import { scanRunCompleteSchema, scanRunCreateSchema, scanRunListQuerySchema } from '../validators/scan-runs.js';
import { completeScanRun, createScanRun, listScanRuns } from '../services/scan-runs.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (req: AuthenticatedRequest, res) => {
  const parsed = scanRunListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid query parameters',
    } as ApiResponse);
  }

  try {
    const runs = await listScanRuns(req.user!.dbUserId, parsed.data.limit);
    res.json({ success: true, data: { runs } } as ApiResponse);
  } catch (error) {
    console.error('[Scans] List error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scan runs',
    } as ApiResponse);
  }
});

router.post('/', async (req: AuthenticatedRequest, res) => {
  const parsed = scanRunCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid scan payload',
    } as ApiResponse);
  }

  try {
    const run = await createScanRun(req.user!.dbUserId, parsed.data);
    res.status(201).json({ success: true, data: { run } } as ApiResponse);
  } catch (error) {
    console.error('[Scans] Create error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create scan run',
    } as ApiResponse);
  }
});

router.patch('/:id', async (req: AuthenticatedRequest, res) => {
  const parsed = scanRunCompleteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid scan completion payload',
    } as ApiResponse);
  }

  try {
    const run = await completeScanRun(req.user!.dbUserId, req.params.id, parsed.data);
    if (!run) {
      return res.status(404).json({
        success: false,
        error: 'Scan run not found',
      } as ApiResponse);
    }

    res.json({ success: true, data: { run } } as ApiResponse);
  } catch (error) {
    console.error('[Scans] Complete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete scan run',
    } as ApiResponse);
  }
});

export default router;
