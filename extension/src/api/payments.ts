import { apiRequest } from './client';
import type { ApiResponse } from './client';
import type { SubscriptionPlan, SubscriptionStatus } from './types';

export type { SubscriptionPlan, SubscriptionStatus };

export async function createCheckout(
  plan: SubscriptionPlan
): Promise<ApiResponse<{ checkoutUrl: string }>> {
  return apiRequest('/payments/checkout', {
    method: 'POST',
    body: JSON.stringify({ plan }),
  });
}

export async function getSubscriptionStatus(): Promise<ApiResponse<SubscriptionStatus>> {
  return apiRequest('/payments/subscription');
}

export async function cancelSubscription(): Promise<ApiResponse<{ message: string }>> {
  return apiRequest('/payments/cancel', {
    method: 'POST',
  });
}

export async function resumeSubscription(): Promise<ApiResponse<{ message: string }>> {
  return apiRequest('/payments/resume', {
    method: 'POST',
  });
}

export async function getCustomerPortalUrl(): Promise<ApiResponse<{ portalUrl: string }>> {
  return apiRequest('/payments/portal');
}
