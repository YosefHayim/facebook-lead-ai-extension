import type { Request, Response } from 'express';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { PLAN_LIMITS } from '../types/index.js';
import type { SubscriptionPlan, SubscriptionStatus } from '../types/index.js';

interface LemonSqueezyWebhookPayload {
  meta: {
    event_name: string;
    custom_data?: {
      user_id?: string;
    };
  };
  data: {
    id: string;
    type: string;
    attributes: {
      store_id: number;
      customer_id: number;
      order_id?: number;
      subscription_id?: number;
      product_id: number;
      variant_id: number;
      status: string;
      card_brand?: string;
      card_last_four?: string;
      pause?: {
        mode: string;
        resumes_at?: string;
      } | null;
      cancelled: boolean;
      renews_at?: string;
      ends_at?: string;
      created_at: string;
      updated_at: string;
      test_mode: boolean;
      urls?: {
        update_payment_method?: string;
        customer_portal?: string;
      };
      user_email?: string;
      user_name?: string;
    };
    relationships?: {
      customer?: {
        data: {
          id: string;
          type: string;
        };
      };
    };
  };
}

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

function mapLemonSqueezyStatus(status: string): SubscriptionStatus {
  const statusMap: Record<string, SubscriptionStatus> = {
    active: 'active',
    cancelled: 'cancelled',
    expired: 'expired',
    past_due: 'past_due',
    paused: 'paused',
    on_trial: 'active',
    unpaid: 'past_due',
  };
  return statusMap[status] || 'active';
}

function getPlanFromVariantId(variantId: number): SubscriptionPlan {
  const proVariantId = parseInt(env.LEMONSQUEEZY_PRO_VARIANT_ID, 10);
  const agencyVariantId = env.LEMONSQUEEZY_AGENCY_VARIANT_ID
    ? parseInt(env.LEMONSQUEEZY_AGENCY_VARIANT_ID, 10)
    : null;

  if (variantId === proVariantId) {
    return 'pro';
  }
  if (agencyVariantId && variantId === agencyVariantId) {
    return 'agency';
  }
  return 'free';
}

export async function handleWebhook(req: Request, res: Response) {
  const signature = req.headers['x-signature'] as string;

  if (!signature) {
    console.error('[Webhook] Missing signature header');
    return res.status(401).json({ error: 'Missing signature' });
  }

  const rawBody = (req as Request & { rawBody?: string }).rawBody;
  if (!rawBody) {
    console.error('[Webhook] Missing raw body');
    return res.status(400).json({ error: 'Missing raw body' });
  }

  const isValid = verifyWebhookSignature(
    rawBody,
    signature,
    env.LEMONSQUEEZY_WEBHOOK_SECRET
  );

  if (!isValid) {
    console.error('[Webhook] Invalid signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  try {
    const payload: LemonSqueezyWebhookPayload = JSON.parse(rawBody);
    const eventName = payload.meta.event_name;

    console.log(`[Webhook] Received event: ${eventName}`);

    switch (eventName) {
      case 'subscription_created':
        await handleSubscriptionCreated(payload);
        break;
      case 'subscription_updated':
        await handleSubscriptionUpdated(payload);
        break;
      case 'subscription_cancelled':
        await handleSubscriptionCancelled(payload);
        break;
      case 'subscription_resumed':
        await handleSubscriptionResumed(payload);
        break;
      case 'subscription_expired':
        await handleSubscriptionExpired(payload);
        break;
      case 'subscription_paused':
        await handleSubscriptionPaused(payload);
        break;
      case 'subscription_unpaused':
        await handleSubscriptionUnpaused(payload);
        break;
      case 'subscription_payment_success':
        await handlePaymentSuccess(payload);
        break;
      case 'subscription_payment_failed':
        await handlePaymentFailed(payload);
        break;
      case 'order_created':
        console.log('[Webhook] Order created - ignoring for subscription logic');
        break;
      default:
        console.log(`[Webhook] Unhandled event: ${eventName}`);
    }

    return res.json({ received: true });
  } catch (error) {
    console.error('[Webhook] Processing error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function handleSubscriptionCreated(payload: LemonSqueezyWebhookPayload) {
  const { data, meta } = payload;
  const userId = meta.custom_data?.user_id;

  if (!userId) {
    console.error('[Webhook] subscription_created: Missing user_id in custom_data');
    return;
  }

  const user = await User.findById(userId);
  if (!user) {
    console.error(`[Webhook] subscription_created: User not found for id: ${userId}`);
    return;
  }

  const plan = getPlanFromVariantId(data.attributes.variant_id);
  const limits = PLAN_LIMITS[plan];

  await User.update(user.id, {
    subscriptionPlan: plan,
    subscriptionStatus: mapLemonSqueezyStatus(data.attributes.status),
    lemonSqueezyCustomerId: data.relationships?.customer?.data?.id || String(data.attributes.customer_id),
    lemonSqueezySubscriptionId: data.id,
    currentPeriodEnd: data.attributes.renews_at ? new Date(data.attributes.renews_at) : undefined,
    cancelAtPeriodEnd: false,
    leadsPerMonth: limits.leadsPerMonth === Infinity ? 999999 : limits.leadsPerMonth,
    aiCallsPerMonth: limits.aiCallsPerMonth,
  });

  console.log(`[Webhook] subscription_created: Updated user ${user.email} to ${plan} plan`);
}

async function handleSubscriptionUpdated(payload: LemonSqueezyWebhookPayload) {
  const { data } = payload;
  const subscriptionId = data.id;

  const user = await User.findByLemonSqueezySubscriptionId(subscriptionId);
  if (!user) {
    console.error(`[Webhook] subscription_updated: User not found for subscription: ${subscriptionId}`);
    return;
  }

  const plan = getPlanFromVariantId(data.attributes.variant_id);
  const limits = PLAN_LIMITS[plan];

  await User.update(user.id, {
    subscriptionPlan: plan,
    subscriptionStatus: mapLemonSqueezyStatus(data.attributes.status),
    currentPeriodEnd: data.attributes.renews_at ? new Date(data.attributes.renews_at) : undefined,
    cancelAtPeriodEnd: data.attributes.cancelled && !!data.attributes.ends_at,
    leadsPerMonth: limits.leadsPerMonth === Infinity ? 999999 : limits.leadsPerMonth,
    aiCallsPerMonth: limits.aiCallsPerMonth,
  });

  console.log(`[Webhook] subscription_updated: Updated user ${user.email} - status: ${data.attributes.status}`);
}

async function handleSubscriptionCancelled(payload: LemonSqueezyWebhookPayload) {
  const { data } = payload;
  const subscriptionId = data.id;

  const user = await User.findByLemonSqueezySubscriptionId(subscriptionId);
  if (!user) {
    console.error(`[Webhook] subscription_cancelled: User not found for subscription: ${subscriptionId}`);
    return;
  }

  await User.update(user.id, {
    subscriptionStatus: 'cancelled',
    cancelAtPeriodEnd: true,
    currentPeriodEnd: data.attributes.ends_at ? new Date(data.attributes.ends_at) : undefined,
  });

  console.log(`[Webhook] subscription_cancelled: User ${user.email} subscription cancelled`);
}

async function handleSubscriptionResumed(payload: LemonSqueezyWebhookPayload) {
  const { data } = payload;
  const subscriptionId = data.id;

  const user = await User.findByLemonSqueezySubscriptionId(subscriptionId);
  if (!user) {
    console.error(`[Webhook] subscription_resumed: User not found for subscription: ${subscriptionId}`);
    return;
  }

  await User.update(user.id, {
    subscriptionStatus: 'active',
    cancelAtPeriodEnd: false,
  });

  console.log(`[Webhook] subscription_resumed: User ${user.email} subscription resumed`);
}

async function handleSubscriptionExpired(payload: LemonSqueezyWebhookPayload) {
  const { data } = payload;
  const subscriptionId = data.id;

  const user = await User.findByLemonSqueezySubscriptionId(subscriptionId);
  if (!user) {
    console.error(`[Webhook] subscription_expired: User not found for subscription: ${subscriptionId}`);
    return;
  }

  await User.update(user.id, {
    subscriptionPlan: 'free',
    subscriptionStatus: 'expired',
    cancelAtPeriodEnd: false,
    leadsPerMonth: PLAN_LIMITS.free.leadsPerMonth,
    aiCallsPerMonth: PLAN_LIMITS.free.aiCallsPerMonth,
  });

  console.log(`[Webhook] subscription_expired: User ${user.email} downgraded to free plan`);
}

async function handleSubscriptionPaused(payload: LemonSqueezyWebhookPayload) {
  const { data } = payload;
  const subscriptionId = data.id;

  const user = await User.findByLemonSqueezySubscriptionId(subscriptionId);
  if (!user) {
    console.error(`[Webhook] subscription_paused: User not found for subscription: ${subscriptionId}`);
    return;
  }

  await User.update(user.id, { subscriptionStatus: 'paused' });
  console.log(`[Webhook] subscription_paused: User ${user.email} subscription paused`);
}

async function handleSubscriptionUnpaused(payload: LemonSqueezyWebhookPayload) {
  const { data } = payload;
  const subscriptionId = data.id;

  const user = await User.findByLemonSqueezySubscriptionId(subscriptionId);
  if (!user) {
    console.error(`[Webhook] subscription_unpaused: User not found for subscription: ${subscriptionId}`);
    return;
  }

  await User.update(user.id, { subscriptionStatus: 'active' });
  console.log(`[Webhook] subscription_unpaused: User ${user.email} subscription resumed`);
}

async function handlePaymentSuccess(payload: LemonSqueezyWebhookPayload) {
  const { data } = payload;
  const subscriptionId = String(data.attributes.subscription_id);

  if (!subscriptionId) {
    console.log('[Webhook] subscription_payment_success: No subscription_id, likely one-time payment');
    return;
  }

  const user = await User.findByLemonSqueezySubscriptionId(subscriptionId);
  if (!user) {
    console.error(`[Webhook] subscription_payment_success: User not found for subscription: ${subscriptionId}`);
    return;
  }

  if (user.subscription.status === 'past_due') {
    await User.update(user.id, { subscriptionStatus: 'active' });
    console.log(`[Webhook] subscription_payment_success: User ${user.email} status updated to active`);
  }
}

async function handlePaymentFailed(payload: LemonSqueezyWebhookPayload) {
  const { data } = payload;
  const subscriptionId = String(data.attributes.subscription_id);

  if (!subscriptionId) {
    console.log('[Webhook] subscription_payment_failed: No subscription_id');
    return;
  }

  const user = await User.findByLemonSqueezySubscriptionId(subscriptionId);
  if (!user) {
    console.error(`[Webhook] subscription_payment_failed: User not found for subscription: ${subscriptionId}`);
    return;
  }

  await User.update(user.id, { subscriptionStatus: 'past_due' });
  console.log(`[Webhook] subscription_payment_failed: User ${user.email} status updated to past_due`);
}
