import type { Request } from 'express';

// ==================== User Types ====================
export type SubscriptionPlan = 'free' | 'pro' | 'agency';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'past_due' | 'paused';

export interface IUser {
  googleId: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  subscription: {
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    lemonSqueezyCustomerId?: string;
    lemonSqueezySubscriptionId?: string;
    currentPeriodEnd?: Date;
    cancelAtPeriodEnd: boolean;
  };
  usage: {
    leadsFoundThisMonth: number;
    aiCallsThisMonth: number;
    lastResetDate: Date;
  };
  limits: {
    leadsPerMonth: number;
    aiCallsPerMonth: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Lead Types ====================
export type IntentType =
  | 'seeking_service'
  | 'hiring'
  | 'complaining'
  | 'recommendation'
  | 'discussion'
  | 'selling'
  | 'irrelevant';

export type LeadStatus = 'new' | 'contacted' | 'converted' | 'ignored';

export interface ILead {
  userId: string;
  postUrl: string;
  postText: string;
  authorName: string;
  authorProfileUrl: string;
  groupName?: string;
  intent: IntentType;
  leadScore: number;
  aiAnalysis?: {
    intent: IntentType;
    confidence: number;
    reasoning: string;
    keywords: string[];
  };
  aiDraftReply?: string;
  status: LeadStatus;
  responseTracking?: {
    responded: boolean;
    responseText?: string;
    respondedAt?: Date;
    gotReply?: boolean;
    repliedAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Persona Types ====================
export type AITone = 'professional' | 'casual' | 'friendly' | 'expert';

export interface IPersona {
  userId: string;
  name: string;
  role: string;
  keywords: string[];
  negativeKeywords: string[];
  aiTone: AITone;
  valueProposition: string;
  signature?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Watched Group Types ====================
export interface IWatchedGroup {
  userId: string;
  name: string;
  url: string;
  category: string;
  lastVisited?: Date;
  leadsFound: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Automation Settings Types ====================
export interface IAutomationSettings {
  userId: string;
  enabled: boolean;
  scanIntervalMinutes: number;
  groupsPerCycle: number;
  delayMinSeconds: number;
  delayMaxSeconds: number;
  lastScanAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Lemon Squeezy Types ====================
export interface LemonSqueezyCheckoutData {
  userId: string;
  email: string;
  variantId: string;
  redirectUrl?: string;
  customData?: Record<string, string>;
}

export interface LemonSqueezyWebhookEvent {
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
      cancelled?: boolean;
      trial_ends_at?: string | null;
      billing_anchor?: number;
      renews_at?: string;
      ends_at?: string | null;
      created_at: string;
      updated_at: string;
      first_subscription_item?: {
        id: number;
        subscription_id: number;
        price_id: number;
        quantity: number;
        created_at: string;
        updated_at: string;
      };
      urls?: {
        update_payment_method?: string;
        customer_portal?: string;
      };
      user_email?: string;
      user_name?: string;
    };
    relationships?: {
      store?: { data: { type: string; id: string } };
      customer?: { data: { type: string; id: string } };
      order?: { data: { type: string; id: string } };
      subscription?: { data: { type: string; id: string } };
      product?: { data: { type: string; id: string } };
      variant?: { data: { type: string; id: string } };
    };
  };
}

// ==================== Google OAuth Types ====================
export interface GoogleTokenInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  error?: string;
  error_description?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    googleId: string;
    email: string;
    dbUserId: string;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ==================== Plan Limits ====================
export const PLAN_LIMITS = {
  free: {
    leadsPerMonth: 10,
    aiCallsPerMonth: 25,
  },
  pro: {
    leadsPerMonth: 500,
    aiCallsPerMonth: 1000,
  },
  agency: {
    leadsPerMonth: Infinity,
    aiCallsPerMonth: 5000,
  },
} as const;
