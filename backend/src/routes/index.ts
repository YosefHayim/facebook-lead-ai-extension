import { Router } from 'express';
import authRouter from './auth.js';
import leadsRouter from './leads.js';
import personasRouter from './personas.js';
import groupsRouter from './groups.js';
import automationRouter from './automation.js';
import automationRunsRouter from './automation-runs.js';
import usageRouter from './usage.js';
import paymentsRouter from './payments.js';
import scansRouter from './scans.js';
import { handleWebhook } from '../webhooks/lemonsqueezy.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/leads', leadsRouter);
router.use('/personas', personasRouter);
router.use('/groups', groupsRouter);
router.use('/automation/runs', automationRunsRouter);
router.use('/automation', automationRouter);
router.use('/usage', usageRouter);
router.use('/payments', paymentsRouter);
router.use('/scans', scansRouter);

router.post('/webhooks/lemonsqueezy', handleWebhook);

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
