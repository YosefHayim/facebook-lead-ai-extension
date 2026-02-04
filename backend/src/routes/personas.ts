import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import type { AuthenticatedRequest, ApiResponse } from '../types/index.js';
import { personaCreateSchema, personaUpdateSchema } from '../validators/personas.js';
import {
  activatePersona,
  createPersona,
  deletePersona,
  getActivePersona,
  getPersonaById,
  listPersonas,
  updatePersona,
} from '../services/personas.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const personas = await listPersonas(req.user!.dbUserId, req.query.activeOnly === 'true');

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
  const parsed = personaCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid persona payload',
    } as ApiResponse);
  }

  try {
    const persona = await createPersona(req.user!.dbUserId, parsed.data);

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
    const persona = await getActivePersona(req.user!.dbUserId);

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
    const persona = await getPersonaById(req.user!.dbUserId, req.params.id);

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
    console.error('[Personas] Get error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch persona',
    } as ApiResponse);
  }
});

router.patch('/:id', async (req: AuthenticatedRequest, res) => {
  const parsed = personaUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid persona update payload',
    } as ApiResponse);
  }

  try {
    const persona = await updatePersona(req.user!.dbUserId, req.params.id, parsed.data);

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
    console.error('[Personas] Update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update persona',
    } as ApiResponse);
  }
});

router.post('/:id/activate', async (req: AuthenticatedRequest, res) => {
  try {
    const persona = await activatePersona(req.user!.dbUserId, req.params.id);

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
    const deleted = await deletePersona(req.user!.dbUserId, req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Persona not found',
      } as ApiResponse);
    }

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
