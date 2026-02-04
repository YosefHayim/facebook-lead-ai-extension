import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import type { AuthenticatedRequest, ApiResponse } from '../types/index.js';
import {
  leadBulkSchema,
  leadCreateSchema,
  leadListQuerySchema,
  leadUpdateSchema,
} from '../validators/leads.js';
import {
  leadContextUpsertSchema,
  leadFeedbackCreateSchema,
  leadNoteCreateSchema,
  leadTagAddSchema,
} from '../validators/lead-meta.js';
import {
  createLead,
  createLeadsBulk,
  deleteLead,
  getLeadById,
  getLeadStats,
  listLeads,
  updateLead,
} from '../services/leads.js';
import {
  addLeadTags,
  createLeadFeedback,
  createLeadNote,
  deleteLeadFeedback,
  deleteLeadNote,
  deleteLeadTag,
  getLeadContext,
  listLeadFeedback,
  listLeadNotes,
  listLeadTags,
  upsertLeadContext,
} from '../services/lead-meta.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (req: AuthenticatedRequest, res) => {
  const parsed = leadListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid query parameters',
    } as ApiResponse);
  }

  try {
    const { status, limit, skip } = parsed.data;
    const data = await listLeads(req.user!.dbUserId, { status, limit, skip });

    res.json({
      success: true,
      data,
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
  const parsed = leadCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid lead payload',
    } as ApiResponse);
  }

  try {
    const result = await createLead(req.user!.dbUserId, parsed.data);

    if ('error' in result) {
      const status =
        result.error === 'User not found'
          ? 404
          : result.error === 'Lead already exists'
            ? 409
            : 403;
      return res.status(status).json({
        success: false,
        error: result.error,
      } as ApiResponse);
    }

    res.status(201).json({
      success: true,
      data: { lead: result.lead },
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
  const parsed = leadBulkSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid leads payload',
    } as ApiResponse);
  }

  try {
    const result = await createLeadsBulk(req.user!.dbUserId, parsed.data.leads);

    if ('error' in result) {
      const status = result.error === 'User not found' ? 404 : 403;
      return res.status(status).json({
        success: false,
        error: result.error,
      } as ApiResponse);
    }

    res.status(201).json({
      success: true,
      data: {
        leads: result.leads,
        created: result.created,
        skipped: result.skipped,
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
    const stats = await getLeadStats(req.user!.dbUserId);

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

router.get('/:id/feedback', async (req: AuthenticatedRequest, res) => {
  try {
    const feedback = await listLeadFeedback(req.user!.dbUserId, req.params.id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found',
      } as ApiResponse);
    }

    res.json({ success: true, data: { feedback } } as ApiResponse);
  } catch (error) {
    console.error('[Leads] Feedback list error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feedback',
    } as ApiResponse);
  }
});

router.post('/:id/feedback', async (req: AuthenticatedRequest, res) => {
  const parsed = leadFeedbackCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid feedback payload',
    } as ApiResponse);
  }

  try {
    const feedback = await createLeadFeedback(req.user!.dbUserId, req.params.id, parsed.data);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found',
      } as ApiResponse);
    }

    res.status(201).json({
      success: true,
      data: { feedback },
    } as ApiResponse);
  } catch (error) {
    console.error('[Leads] Feedback create error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create feedback',
    } as ApiResponse);
  }
});

router.delete('/:id/feedback/:feedbackId', async (req: AuthenticatedRequest, res) => {
  try {
    const deleted = await deleteLeadFeedback(req.user!.dbUserId, req.params.id, req.params.feedbackId);
    if (deleted === null) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found',
      } as ApiResponse);
    }
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found',
      } as ApiResponse);
    }

    res.json({ success: true, message: 'Feedback deleted' } as ApiResponse);
  } catch (error) {
    console.error('[Leads] Feedback delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete feedback',
    } as ApiResponse);
  }
});

router.get('/:id/context', async (req: AuthenticatedRequest, res) => {
  try {
    const context = await getLeadContext(req.user!.dbUserId, req.params.id);
    if (context === null) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found',
      } as ApiResponse);
    }

    res.json({ success: true, data: { context } } as ApiResponse);
  } catch (error) {
    console.error('[Leads] Context get error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch context',
    } as ApiResponse);
  }
});

router.put('/:id/context', async (req: AuthenticatedRequest, res) => {
  const parsed = leadContextUpsertSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid context payload',
    } as ApiResponse);
  }

  try {
    const context = await upsertLeadContext(req.user!.dbUserId, req.params.id, {
      lci: parsed.data.lci,
      confidenceScore: parsed.data.confidenceScore,
      fetchedAt: parsed.data.fetchedAt ? new Date(parsed.data.fetchedAt) : undefined,
    });

    if (!context) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found',
      } as ApiResponse);
    }

    res.json({ success: true, data: { context } } as ApiResponse);
  } catch (error) {
    console.error('[Leads] Context upsert error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update context',
    } as ApiResponse);
  }
});

router.get('/:id/notes', async (req: AuthenticatedRequest, res) => {
  try {
    const notes = await listLeadNotes(req.user!.dbUserId, req.params.id);
    if (!notes) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found',
      } as ApiResponse);
    }

    res.json({ success: true, data: { notes } } as ApiResponse);
  } catch (error) {
    console.error('[Leads] Notes list error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notes',
    } as ApiResponse);
  }
});

router.post('/:id/notes', async (req: AuthenticatedRequest, res) => {
  const parsed = leadNoteCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid note payload',
    } as ApiResponse);
  }

  try {
    const note = await createLeadNote(req.user!.dbUserId, req.params.id, parsed.data.note);
    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found',
      } as ApiResponse);
    }

    res.status(201).json({ success: true, data: { note } } as ApiResponse);
  } catch (error) {
    console.error('[Leads] Note create error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create note',
    } as ApiResponse);
  }
});

router.delete('/:id/notes/:noteId', async (req: AuthenticatedRequest, res) => {
  try {
    const deleted = await deleteLeadNote(req.user!.dbUserId, req.params.id, req.params.noteId);
    if (deleted === null) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found',
      } as ApiResponse);
    }
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Note not found',
      } as ApiResponse);
    }

    res.json({ success: true, message: 'Note deleted' } as ApiResponse);
  } catch (error) {
    console.error('[Leads] Note delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete note',
    } as ApiResponse);
  }
});

router.get('/:id/tags', async (req: AuthenticatedRequest, res) => {
  try {
    const tags = await listLeadTags(req.user!.dbUserId, req.params.id);
    if (!tags) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found',
      } as ApiResponse);
    }

    res.json({ success: true, data: { tags } } as ApiResponse);
  } catch (error) {
    console.error('[Leads] Tags list error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tags',
    } as ApiResponse);
  }
});

router.post('/:id/tags', async (req: AuthenticatedRequest, res) => {
  const parsed = leadTagAddSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid tags payload',
    } as ApiResponse);
  }

  try {
    const tags = await addLeadTags(req.user!.dbUserId, req.params.id, parsed.data.tags);
    if (!tags) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found',
      } as ApiResponse);
    }

    res.status(201).json({ success: true, data: { tags } } as ApiResponse);
  } catch (error) {
    console.error('[Leads] Tags add error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add tags',
    } as ApiResponse);
  }
});

router.delete('/:id/tags/:tagId', async (req: AuthenticatedRequest, res) => {
  try {
    const deleted = await deleteLeadTag(req.user!.dbUserId, req.params.id, req.params.tagId);
    if (deleted === null) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found',
      } as ApiResponse);
    }
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Tag not found',
      } as ApiResponse);
    }

    res.json({ success: true, message: 'Tag deleted' } as ApiResponse);
  } catch (error) {
    console.error('[Leads] Tag delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete tag',
    } as ApiResponse);
  }
});

router.get('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const lead = await getLeadById(req.user!.dbUserId, req.params.id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found',
      } as ApiResponse);
    }

    res.json({ success: true, data: { lead } } as ApiResponse);
  } catch (error) {
    console.error('[Leads] Get error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch lead',
    } as ApiResponse);
  }
});

router.patch('/:id', async (req: AuthenticatedRequest, res) => {
  const parsed = leadUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid lead update payload',
    } as ApiResponse);
  }

  try {
    const updates = parsed.data;
    const responseTracking = updates.responseTracking
      ? {
          responded: updates.responseTracking.responded,
          responseText: updates.responseTracking.responseText,
          respondedAt: updates.responseTracking.respondedAt
            ? new Date(updates.responseTracking.respondedAt)
            : undefined,
          gotReply: updates.responseTracking.gotReply,
          repliedAt: updates.responseTracking.repliedAt
            ? new Date(updates.responseTracking.repliedAt)
            : undefined,
        }
      : undefined;

    const lead = await updateLead(req.user!.dbUserId, req.params.id, {
      status: updates.status,
      aiDraftReply: updates.aiDraftReply,
      responseTracking,
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found',
      } as ApiResponse);
    }

    res.json({ success: true, data: { lead } } as ApiResponse);
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
    const deleted = await deleteLead(req.user!.dbUserId, req.params.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found',
      } as ApiResponse);
    }

    res.json({ success: true, message: 'Lead deleted' } as ApiResponse);
  } catch (error) {
    console.error('[Leads] Delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete lead',
    } as ApiResponse);
  }
});

export default router;
