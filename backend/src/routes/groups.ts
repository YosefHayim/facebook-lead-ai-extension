import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import type { AuthenticatedRequest, ApiResponse } from '../types/index.js';
import { groupCreateSchema, groupUpdateSchema, groupVisitSchema } from '../validators/groups.js';
import {
  createGroup,
  deleteGroup,
  getGroupById,
  getNextGroupToVisit,
  listGroups,
  recordGroupVisit,
  updateGroup,
} from '../services/groups.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const groups = await listGroups(req.user!.dbUserId, req.query.activeOnly === 'true');

    res.json({
      success: true,
      data: { groups },
    } as ApiResponse);
  } catch (error) {
    console.error('[Groups] List error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch groups',
    } as ApiResponse);
  }
});

router.post('/', async (req: AuthenticatedRequest, res) => {
  const parsed = groupCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid group payload',
    } as ApiResponse);
  }

  try {
    const result = await createGroup(req.user!.dbUserId, parsed.data);

    if ('error' in result) {
      return res.status(409).json({
        success: false,
        error: result.error,
        data: { group: result.group },
      } as ApiResponse);
    }

    res.status(201).json({
      success: true,
      data: { group: result.group },
    } as ApiResponse);
  } catch (error) {
    console.error('[Groups] Create error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create group',
    } as ApiResponse);
  }
});

router.get('/next', async (req: AuthenticatedRequest, res) => {
  try {
    const group = await getNextGroupToVisit(req.user!.dbUserId);

    res.json({
      success: true,
      data: { group },
    } as ApiResponse);
  } catch (error) {
    console.error('[Groups] Get next error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch next group',
    } as ApiResponse);
  }
});

router.get('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const group = await getGroupById(req.user!.dbUserId, req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found',
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: { group },
    } as ApiResponse);
  } catch (error) {
    console.error('[Groups] Get error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch group',
    } as ApiResponse);
  }
});

router.patch('/:id', async (req: AuthenticatedRequest, res) => {
  const parsed = groupUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid group update payload',
    } as ApiResponse);
  }

  try {
    const updates = parsed.data;
    const group = await updateGroup(req.user!.dbUserId, req.params.id, {
      ...updates,
      lastVisited: updates.lastVisited ? new Date(updates.lastVisited) : undefined,
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found',
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: { group },
    } as ApiResponse);
  } catch (error) {
    console.error('[Groups] Update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update group',
    } as ApiResponse);
  }
});

router.post('/:id/visit', async (req: AuthenticatedRequest, res) => {
  const parsed = groupVisitSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid visit payload',
    } as ApiResponse);
  }

  try {
    const group = await recordGroupVisit(req.user!.dbUserId, req.params.id, parsed.data.leadsFound ?? 0);

    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found',
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: { group },
    } as ApiResponse);
  } catch (error) {
    console.error('[Groups] Visit error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record visit',
    } as ApiResponse);
  }
});

router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const deleted = await deleteGroup(req.user!.dbUserId, req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Group not found',
      } as ApiResponse);
    }

    res.json({
      success: true,
      message: 'Group deleted',
    } as ApiResponse);
  } catch (error) {
    console.error('[Groups] Delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete group',
    } as ApiResponse);
  }
});

export default router;
