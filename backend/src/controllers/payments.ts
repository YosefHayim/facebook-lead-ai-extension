import type { Response } from 'express';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import {
  createCheckoutSession,
  cancelUserSubscription,
  resumeUserSubscription,
  getSubscriptionDetails,
} from '../services/lemonsqueezy.js';
import type { AuthenticatedRequest, ApiResponse, SubscriptionPlan } from '../types/index.js';

export async function createCheckout(
  req: AuthenticatedRequest,
  res: Response<ApiResponse<{ checkoutUrl: string }>>
) {
  try {
    const { plan } = req.body as { plan: SubscriptionPlan };
    const dbUserId = req.user?.dbUserId;

    if (!dbUserId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const user = await User.findById(dbUserId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    let variantId: string;
    if (plan === 'pro') {
      variantId = env.LEMONSQUEEZY_PRO_VARIANT_ID;
    } else if (plan === 'agency' && env.LEMONSQUEEZY_AGENCY_VARIANT_ID) {
      variantId = env.LEMONSQUEEZY_AGENCY_VARIANT_ID;
    } else {
      return res.status(400).json({ success: false, error: 'Invalid plan' });
    }

    const checkout = await createCheckoutSession({
      userId: user.id,
      email: user.email,
      variantId,
      customData: {
        user_id: user.id,
      },
    });

    if (!checkout) {
      return res.status(500).json({ success: false, error: 'Failed to create checkout' });
    }

    return res.json({
      success: true,
      data: { checkoutUrl: checkout.checkoutUrl },
    });
  } catch (error) {
    console.error('[Payments] Create checkout error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function getSubscriptionStatus(
  req: AuthenticatedRequest,
  res: Response<ApiResponse<{
    plan: SubscriptionPlan;
    status: string;
    currentPeriodEnd?: string;
    cancelAtPeriodEnd: boolean;
    limits: { leadsPerMonth: number; aiCallsPerMonth: number };
    usage: { leadsFoundThisMonth: number; aiCallsThisMonth: number };
  }>>
) {
  try {
    const dbUserId = req.user?.dbUserId;

    if (!dbUserId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const user = await User.findById(dbUserId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.json({
      success: true,
      data: {
        plan: user.subscription.plan,
        status: user.subscription.status,
        currentPeriodEnd: user.subscription.currentPeriodEnd?.toISOString(),
        cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
        limits: {
          leadsPerMonth: user.limits.leadsPerMonth,
          aiCallsPerMonth: user.limits.aiCallsPerMonth,
        },
        usage: {
          leadsFoundThisMonth: user.usage.leadsFoundThisMonth,
          aiCallsThisMonth: user.usage.aiCallsThisMonth,
        },
      },
    });
  } catch (error) {
    console.error('[Payments] Get subscription status error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function cancelSubscription(
  req: AuthenticatedRequest,
  res: Response<ApiResponse<{ message: string }>>
) {
  try {
    const dbUserId = req.user?.dbUserId;

    if (!dbUserId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const user = await User.findById(dbUserId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (!user.subscription.lemonSqueezySubscriptionId) {
      return res.status(400).json({ success: false, error: 'No active subscription' });
    }

    const success = await cancelUserSubscription(user.subscription.lemonSqueezySubscriptionId);

    if (!success) {
      return res.status(500).json({ success: false, error: 'Failed to cancel subscription' });
    }

    await User.update(user.id, { cancelAtPeriodEnd: true });

    return res.json({
      success: true,
      data: { message: 'Subscription will be cancelled at the end of the billing period' },
    });
  } catch (error) {
    console.error('[Payments] Cancel subscription error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function resumeSubscription(
  req: AuthenticatedRequest,
  res: Response<ApiResponse<{ message: string }>>
) {
  try {
    const dbUserId = req.user?.dbUserId;

    if (!dbUserId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const user = await User.findById(dbUserId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (!user.subscription.lemonSqueezySubscriptionId) {
      return res.status(400).json({ success: false, error: 'No subscription to resume' });
    }

    const success = await resumeUserSubscription(user.subscription.lemonSqueezySubscriptionId);

    if (!success) {
      return res.status(500).json({ success: false, error: 'Failed to resume subscription' });
    }

    await User.update(user.id, { cancelAtPeriodEnd: false });

    return res.json({
      success: true,
      data: { message: 'Subscription resumed successfully' },
    });
  } catch (error) {
    console.error('[Payments] Resume subscription error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function getCustomerPortalUrl(
  req: AuthenticatedRequest,
  res: Response<ApiResponse<{ portalUrl: string }>>
) {
  try {
    const dbUserId = req.user?.dbUserId;

    if (!dbUserId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const user = await User.findById(dbUserId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (!user.subscription.lemonSqueezySubscriptionId) {
      return res.status(400).json({ success: false, error: 'No active subscription' });
    }

    const subscription = await getSubscriptionDetails(user.subscription.lemonSqueezySubscriptionId);

    if (!subscription?.attributes.urls?.customer_portal) {
      return res.status(500).json({ success: false, error: 'Portal URL not available' });
    }

    return res.json({
      success: true,
      data: { portalUrl: subscription.attributes.urls.customer_portal },
    });
  } catch (error) {
    console.error('[Payments] Get portal URL error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
