import {
  lemonSqueezySetup,
  createCheckout,
  getSubscription,
  cancelSubscription,
  updateSubscription,
  type Checkout,
  type Subscription,
} from '@lemonsqueezy/lemonsqueezy.js';
import { env } from '../config/env.js';
import type { LemonSqueezyCheckoutData, SubscriptionPlan } from '../types/index.js';

lemonSqueezySetup({
  apiKey: env.LEMONSQUEEZY_API_KEY,
  onError: (error) => console.error('[LemonSqueezy] Error:', error),
});

const VARIANT_TO_PLAN: Record<string, SubscriptionPlan> = {
  [env.LEMONSQUEEZY_PRO_VARIANT_ID]: 'pro',
  ...(env.LEMONSQUEEZY_AGENCY_VARIANT_ID
    ? { [env.LEMONSQUEEZY_AGENCY_VARIANT_ID]: 'agency' }
    : {}),
};

export function getPlanFromVariantId(variantId: string): SubscriptionPlan {
  return VARIANT_TO_PLAN[variantId] || 'free';
}

export async function createCheckoutSession(
  data: LemonSqueezyCheckoutData
): Promise<{ checkoutUrl: string; checkoutId: string } | null> {
  try {
    const { data: checkout, error } = await createCheckout(
      env.LEMONSQUEEZY_STORE_ID,
      data.variantId,
      {
        checkoutData: {
          email: data.email,
          custom: {
            user_id: data.userId,
          },
        },
        productOptions: {
          redirectUrl: data.redirectUrl || 'https://leadscout.ai/thank-you',
        },
        checkoutOptions: {
          embed: false,
          media: true,
          logo: true,
        },
      }
    );

    if (error || !checkout) {
      console.error('[LemonSqueezy] Checkout creation failed:', error);
      return null;
    }

    const checkoutData = checkout.data as Checkout['data'];
    return {
      checkoutUrl: checkoutData.attributes.url,
      checkoutId: checkoutData.id,
    };
  } catch (error) {
    console.error('[LemonSqueezy] Checkout creation error:', error);
    return null;
  }
}

export async function getSubscriptionDetails(
  subscriptionId: string
): Promise<Subscription['data'] | null> {
  try {
    const { data, error } = await getSubscription(subscriptionId);

    if (error || !data) {
      console.error('[LemonSqueezy] Get subscription failed:', error);
      return null;
    }

    return data.data as Subscription['data'];
  } catch (error) {
    console.error('[LemonSqueezy] Get subscription error:', error);
    return null;
  }
}

export async function cancelUserSubscription(
  subscriptionId: string
): Promise<boolean> {
  try {
    const { error } = await cancelSubscription(subscriptionId);

    if (error) {
      console.error('[LemonSqueezy] Cancel subscription failed:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[LemonSqueezy] Cancel subscription error:', error);
    return false;
  }
}

export async function resumeUserSubscription(
  subscriptionId: string
): Promise<boolean> {
  try {
    const { error } = await updateSubscription(subscriptionId, {
      cancelled: false,
    });

    if (error) {
      console.error('[LemonSqueezy] Resume subscription failed:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[LemonSqueezy] Resume subscription error:', error);
    return false;
  }
}

export async function pauseUserSubscription(
  subscriptionId: string,
  resumesAt?: Date
): Promise<boolean> {
  try {
    const { error } = await updateSubscription(subscriptionId, {
      pause: {
        mode: resumesAt ? 'free' : 'void',
        resumesAt: resumesAt?.toISOString(),
      },
    });

    if (error) {
      console.error('[LemonSqueezy] Pause subscription failed:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[LemonSqueezy] Pause subscription error:', error);
    return false;
  }
}

export async function unpauseUserSubscription(
  subscriptionId: string
): Promise<boolean> {
  try {
    const { error } = await updateSubscription(subscriptionId, {
      pause: null,
    });

    if (error) {
      console.error('[LemonSqueezy] Unpause subscription failed:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[LemonSqueezy] Unpause subscription error:', error);
    return false;
  }
}
