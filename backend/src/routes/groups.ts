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
    const groupData = req.body;

    const existing = await WatchedGroup.findOne({
      userId: req.user!.dbUserId,
      url: groupData.url,
    });

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
    const group = await WatchedGroup.findOne({
      _id: req.params.id,
      userId: req.user!.dbUserId,
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
    console.error('[Groups] Get error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch group',
    } as ApiResponse);
  }
});

router.patch('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const group = await WatchedGroup.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!.dbUserId },
      { $set: req.body },
      { new: true }
    );

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
  try {
    const { leadsFound = 0 } = req.body as { leadsFound?: number };

    const group = await WatchedGroup.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!.dbUserId },
      {
        $set: { lastVisited: new Date() },
        $inc: { leadsFound },
      },
      { new: true }
    );

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
    const group = await WatchedGroup.findOneAndDelete({
      _id: req.params.id,
      userId: req.user!.dbUserId,
    });

    if (!group) {
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
