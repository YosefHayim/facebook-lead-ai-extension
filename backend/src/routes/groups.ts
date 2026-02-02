import { Router } from 'express';
import { WatchedGroup } from '../models/WatchedGroup.js';
import { requireAuth } from '../middleware/auth.js';
import type { AuthenticatedRequest, ApiResponse } from '../types/index.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const { activeOnly } = req.query;

    const groups = await WatchedGroup.findByUserId(req.user!.dbUserId, {
      activeOnly: activeOnly === 'true',
    });

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
  try {
    const groupData = req.body as {
      name: string;
      url: string;
      category?: string;
      isActive?: boolean;
    };

    const existing = await WatchedGroup.findByUrl(req.user!.dbUserId, groupData.url);

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Group already exists',
        data: { group: existing },
      } as ApiResponse);
    }

    const group = await WatchedGroup.create({
      ...groupData,
      userId: req.user!.dbUserId,
    });

    res.status(201).json({
      success: true,
      data: { group },
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
    const group = await WatchedGroup.findNextToVisit(req.user!.dbUserId);

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
    const id = req.params.id as string;
    const group = await WatchedGroup.findById(id);

    if (!group || group.userId !== req.user!.dbUserId) {
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
  try {
    const id = req.params.id as string;
    const existingGroup = await WatchedGroup.findById(id);

    if (!existingGroup || existingGroup.userId !== req.user!.dbUserId) {
      return res.status(404).json({
        success: false,
        error: 'Group not found',
      } as ApiResponse);
    }

    const group = await WatchedGroup.update(id, req.body);

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
  try {
    const id = req.params.id as string;
    const { leadsFound = 0 } = req.body as { leadsFound?: number };

    const existingGroup = await WatchedGroup.findById(id);

    if (!existingGroup || existingGroup.userId !== req.user!.dbUserId) {
      return res.status(404).json({
        success: false,
        error: 'Group not found',
      } as ApiResponse);
    }

    await WatchedGroup.incrementLeadsFound(id, leadsFound);
    const group = await WatchedGroup.findById(id);

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
    const id = req.params.id as string;
    const existingGroup = await WatchedGroup.findById(id);

    if (!existingGroup || existingGroup.userId !== req.user!.dbUserId) {
      return res.status(404).json({
        success: false,
        error: 'Group not found',
      } as ApiResponse);
    }

    await WatchedGroup.delete(id);

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
