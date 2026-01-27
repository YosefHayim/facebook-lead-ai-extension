import { Router } from 'express';
import paymentsRouter from './payments.js';
import { handleWebhook } from '../webhooks/lemonsqueezy.js';

const router = Router();

router.use('/payments', paymentsRouter);

router.post('/webhooks/lemonsqueezy', handleWebhook);

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
