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

export interface ApiLead {
  id: string;
  postUrl: string;
  postText: string;
  authorName: string;
  authorProfileUrl: string;
  groupName?: string;
  intent: string;
  leadScore: number;
  aiAnalysis?: {
    intent: string;
    confidence: number;
    reasoning: string;
    keywords: string[];
  };
  aiDraftReply?: string;
  status: 'new' | 'contacted' | 'converted' | 'ignored';
  responseTracking?: {
    responded: boolean;
    responseText?: string;
    respondedAt?: string;
    gotReply?: boolean;
    repliedAt?: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface CreateLeadInput {
  postUrl: string;
  postText: string;
  authorName: string;
  authorProfileUrl: string;
  groupName?: string;
  intent: string;
  leadScore: number;
  aiAnalysis?: {
    intent: string;
    confidence: number;
    reasoning: string;
    keywords: string[];
  };
  aiDraftReply?: string;
}

export interface ApiPersona {
  id: string;
  name: string;
  role: string;
  keywords: string[];
  negativeKeywords: string[];
  aiTone: 'professional' | 'casual' | 'friendly' | 'expert';
  valueProposition: string;
  signature?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreatePersonaInput {
  name: string;
  role: string;
  keywords?: string[];
  negativeKeywords?: string[];
  aiTone?: 'professional' | 'casual' | 'friendly' | 'expert';
  valueProposition: string;
  signature?: string;
  isActive?: boolean;
}

export interface ApiWatchedGroup {
  id: string;
  name: string;
  url: string;
  category: string;
  lastVisited?: string;
  leadsFound: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateGroupInput {
  name: string;
  url: string;
  category?: string;
  isActive?: boolean;
}

export interface UsageInfo {
  usage: {
    leadsFoundThisMonth: number;
    aiCallsThisMonth: number;
  };
  limits: {
    leadsPerMonth: number;
    aiCallsPerMonth: number;
  };
  plan: SubscriptionPlan;
}

export interface AutomationSettings {
  enabled: boolean;
  scanIntervalMinutes: number;
  groupsPerCycle: number;
  delayMinSeconds: number;
  delayMaxSeconds: number;
  lastScanAt?: string;
}
