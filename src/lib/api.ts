import { supabaseAuth } from './supabase';
import { trackError } from './analytics';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function getAuthToken(): Promise<string | null> {
  const supabase = supabaseAuth.getClient();
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const existingHeaders = options.headers as Record<string, string> | undefined;
  if (existingHeaders) {
    Object.assign(headers, existingHeaders);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}`,
      };
    }

    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Network error';
    trackError(error instanceof Error ? error : new Error(errorMessage), {
      endpoint,
      method: options.method || 'GET',
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

export type SubscriptionPlan = 'free' | 'pro' | 'agency';

export interface SubscriptionStatus {
  plan: SubscriptionPlan;
  status: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  limits: {
    leadsPerMonth: number;
    aiCallsPerMonth: number;
  };
  usage: {
    leadsFoundThisMonth: number;
    aiCallsThisMonth: number;
  };
}

export async function createCheckout(
  plan: SubscriptionPlan
): Promise<ApiResponse<{ checkoutUrl: string }>> {
  return apiRequest('/payments/checkout', {
    method: 'POST',
    body: JSON.stringify({ plan }),
  });
}

export async function getSubscriptionStatus(): Promise<
  ApiResponse<SubscriptionStatus>
> {
  return apiRequest('/payments/subscription');
}

export async function cancelSubscription(): Promise<
  ApiResponse<{ message: string }>
> {
  return apiRequest('/payments/cancel', {
    method: 'POST',
  });
}

export async function resumeSubscription(): Promise<
  ApiResponse<{ message: string }>
> {
  return apiRequest('/payments/resume', {
    method: 'POST',
  });
}

export async function getCustomerPortalUrl(): Promise<
  ApiResponse<{ portalUrl: string }>
> {
  return apiRequest('/payments/portal');
}

export async function checkHealth(): Promise<
  ApiResponse<{ status: string; timestamp: string }>
> {
  return apiRequest('/health');
}
