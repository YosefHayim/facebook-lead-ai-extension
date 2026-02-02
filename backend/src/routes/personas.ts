import { Router } from 'express';
import { Persona } from '../models/Persona.js';
import { requireAuth } from '../middleware/auth.js';
import type { AuthenticatedRequest, ApiResponse, AITone } from '../types/index.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const { activeOnly } = req.query;

    const personas = await Persona.findByUserId(req.user!.dbUserId, {
      activeOnly: activeOnly === 'true',
    });

    res.json({
      success: true,
      data: { personas },
    } as ApiResponse);
  } catch (error) {
    console.error('[Personas] List error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch personas',
    } as ApiResponse);
  }
});

router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const personaData = req.body as {
      name: string;
      role: string;
      keywords?: string[];
      negativeKeywords?: string[];
      aiTone?: AITone;
      valueProposition: string;
      signature?: string;
      isActive?: boolean;
    };

    const persona = await Persona.create({
      ...personaData,
      userId: req.user!.dbUserId,
    });

    res.status(201).json({
      success: true,
      data: { persona },
    } as ApiResponse);
  } catch (error) {
    console.error('[Personas] Create error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create persona',
    } as ApiResponse);
  }
});

router.get('/active', async (req: AuthenticatedRequest, res) => {
  try {
    const persona = await Persona.findActivePersona(req.user!.dbUserId);

    res.json({
      success: true,
      data: { persona },
    } as ApiResponse);
  } catch (error) {
    console.error('[Personas] Get active error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active persona',
    } as ApiResponse);
  }
});

router.get('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const id = req.params.id as string;
    const persona = await Persona.findById(id);

    if (!persona || persona.userId !== req.user!.dbUserId) {
      return res.status(404).json({
        success: false,
        error: 'Persona not found',
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: { persona },
    } as ApiResponse);
  } catch (error) {
    console.error('[Personas] Get error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch persona',
    } as ApiResponse);
  }
});

router.patch('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const id = req.params.id as string;
    const existingPersona = await Persona.findById(id);

    if (!existingPersona || existingPersona.userId !== req.user!.dbUserId) {
      return res.status(404).json({
        success: false,
        error: 'Persona not found',
      } as ApiResponse);
    }

    const persona = await Persona.update(id, req.body);

    res.json({
      success: true,
      data: { persona },
    } as ApiResponse);
  } catch (error) {
    console.error('[Personas] Update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update persona',
    } as ApiResponse);
  }
});

router.post('/:id/activate', async (req: AuthenticatedRequest, res) => {
  try {
    const id = req.params.id as string;
    const persona = await Persona.activate(id, req.user!.dbUserId);

    if (!persona) {
      return res.status(404).json({
        success: false,
        error: 'Persona not found',
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: { persona },
    } as ApiResponse);
  } catch (error) {
    console.error('[Personas] Activate error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to activate persona',
    } as ApiResponse);
  }
});

router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const id = req.params.id as string;
    const existingPersona = await Persona.findById(id);

    if (!existingPersona || existingPersona.userId !== req.user!.dbUserId) {
      return res.status(404).json({
        success: false,
        error: 'Persona not found',
      } as ApiResponse);
    }

    await Persona.delete(id);

    res.json({
      success: true,
      message: 'Persona deleted',
    } as ApiResponse);
  } catch (error) {
    console.error('[Personas] Delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete persona',
    } as ApiResponse);
  }
});

export default router;
