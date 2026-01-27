import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  createCheckout,
  getSubscriptionStatus,
  cancelSubscription,
  resumeSubscription,
  getCustomerPortalUrl,
} from '../controllers/payments.js';

const router = Router();

router.post('/checkout', requireAuth, createCheckout);
router.get('/subscription', requireAuth, getSubscriptionStatus);
router.post('/cancel', requireAuth, cancelSubscription);
router.post('/resume', requireAuth, resumeSubscription);
router.get('/portal', requireAuth, getCustomerPortalUrl);

export default router;
