import { Router } from 'express';
import { Lead } from '../models/Lead.js';
import { User } from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import type { AuthenticatedRequest, ApiResponse, LeadStatus, IntentType } from '../types/index.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const { status, limit = '50', skip = '0' } = req.query;

    const options: { status?: LeadStatus; limit?: number; skip?: number } = {
      limit: parseInt(limit as string, 10),
      skip: parseInt(skip as string, 10),
    };

    if (status && ['new', 'contacted', 'converted', 'ignored'].includes(status as string)) {
      options.status = status as LeadStatus;
    }

    const leads = await Lead.findByUserId(req.user!.dbUserId, options);
    const total = await Lead.countByUserId(req.user!.dbUserId, { status: options.status });

    res.json({
      success: true,
      data: { leads, total },
    } as ApiResponse);
  } catch (error) {
    console.error('[Leads] List error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leads',
    } as ApiResponse);
  }
});

router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const leadData = req.body as {
      postUrl: string;
      postText: string;
      authorName: string;
      authorProfileUrl: string;
      groupName?: string;
      intent: IntentType;
      leadScore: number;
      aiAnalysis?: {
        intent: IntentType;
        confidence: number;
        reasoning: string;
        keywords: string[];
      };
      aiDraftReply?: string;
    };

    const user = await User.findById(req.user!.dbUserId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      } as ApiResponse);
    }

    if (!User.isWithinLimits(user, 'leads')) {
      return res.status(403).json({
        success: false,
        error: 'Monthly lead limit reached',
      } as ApiResponse);
    }

    const lead = await Lead.create({
      ...leadData,
      userId: req.user!.dbUserId,
    });

    await User.incrementUsage(user.id, 'leads');

    res.status(201).json({
      success: true,
      data: { lead },
    } as ApiResponse);
  } catch (error) {
    console.error('[Leads] Create error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create lead',
    } as ApiResponse);
  }
});

router.post('/bulk', async (req: AuthenticatedRequest, res) => {
  try {
    const { leads: leadsData } = req.body as { leads: Array<{
      postUrl: string;
      postText: string;
      authorName: string;
      authorProfileUrl: string;
      groupName?: string;
      intent: IntentType;
      leadScore: number;
      aiAnalysis?: {
        intent: IntentType;
        confidence: number;
        reasoning: string;
        keywords: string[];
      };
      aiDraftReply?: string;
    }> };

    if (!Array.isArray(leadsData)) {
      return res.status(400).json({
        success: false,
        error: 'Leads must be an array',
      } as ApiResponse);
    }

    const user = await User.findById(req.user!.dbUserId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      } as ApiResponse);
    }

    const remaining = user.limits.leadsPerMonth - user.usage.leadsFoundThisMonth;
    const toCreate = leadsData.slice(0, remaining);

    const leads = await Lead.createBulk(
      toCreate.map((lead) => ({
        ...lead,
        userId: req.user!.dbUserId,
      }))
    );

    await User.incrementUsage(user.id, 'leads', leads.length);

    res.status(201).json({
      success: true,
      data: {
        leads,
        created: leads.length,
        skipped: leadsData.length - leads.length,
      },
    } as ApiResponse);
  } catch (error) {
    console.error('[Leads] Bulk create error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create leads',
    } as ApiResponse);
  }
});

router.get('/stats/summary', async (req: AuthenticatedRequest, res) => {
  try {
    const stats = await Lead.getStats(req.user!.dbUserId);

    res.json({
      success: true,
      data: {
        total: stats.total,
        thisMonth: stats.thisMonth,
        byStatus: stats.byStatus,
      },
    } as ApiResponse);
  } catch (error) {
    console.error('[Leads] Stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats',
    } as ApiResponse);
  }
});

router.get('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const id = req.params.id as string;
    const lead = await Lead.findById(id);

    if (!lead || lead.userId !== req.user!.dbUserId) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found',
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: { lead },
    } as ApiResponse);
  } catch (error) {
    console.error('[Leads] Get error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch lead',
    } as ApiResponse);
  }
});

router.patch('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const id = req.params.id as string;
    const existingLead = await Lead.findById(id);

    if (!existingLead || existingLead.userId !== req.user!.dbUserId) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found',
      } as ApiResponse);
    }

    const lead = await Lead.update(id, req.body);

    res.json({
      success: true,
      data: { lead },
    } as ApiResponse);
  } catch (error) {
    console.error('[Leads] Update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update lead',
    } as ApiResponse);
  }
});

router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const id = req.params.id as string;
    const existingLead = await Lead.findById(id);

    if (!existingLead || existingLead.userId !== req.user!.dbUserId) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found',
      } as ApiResponse);
    }

    await Lead.delete(id);

    res.json({
      success: true,
      message: 'Lead deleted',
    } as ApiResponse);
  } catch (error) {
    console.error('[Leads] Delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete lead',
    } as ApiResponse);
  }
});

export default router;
