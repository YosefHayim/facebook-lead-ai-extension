import { authService } from './auth';
import { trackError } from './analytics';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = authService.getAccessToken();

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

export async function checkHealth(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
  return apiRequest('/health');
}

export interface Lead {
  _id: string;
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
  };
  createdAt: string;
}

export async function getLeads(options?: {
  status?: string;
  limit?: number;
  skip?: number;
}): Promise<ApiResponse<{ leads: Lead[]; total: number }>> {
  const params = new URLSearchParams();
  if (options?.status) params.set('status', options.status);
  if (options?.limit) params.set('limit', options.limit.toString());
  if (options?.skip) params.set('skip', options.skip.toString());

  const query = params.toString();
  return apiRequest(`/leads${query ? `?${query}` : ''}`);
}

export async function createLead(
  lead: Omit<Lead, '_id' | 'createdAt'>
): Promise<ApiResponse<{ lead: Lead }>> {
  return apiRequest('/leads', {
    method: 'POST',
    body: JSON.stringify(lead),
  });
}

export async function createLeadsBulk(
  leads: Omit<Lead, '_id' | 'createdAt'>[]
): Promise<ApiResponse<{ leads: Lead[]; created: number; skipped: number }>> {
  return apiRequest('/leads/bulk', {
    method: 'POST',
    body: JSON.stringify({ leads }),
  });
}

export async function updateLead(
  leadId: string,
  updates: Partial<Lead>
): Promise<ApiResponse<{ lead: Lead }>> {
  return apiRequest(`/leads/${leadId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteLead(leadId: string): Promise<ApiResponse<{ message: string }>> {
  return apiRequest(`/leads/${leadId}`, {
    method: 'DELETE',
  });
}

export async function getLeadStats(): Promise<
  ApiResponse<{
    total: number;
    thisMonth: number;
    byStatus: {
      new: number;
      contacted: number;
      converted: number;
      ignored: number;
    };
  }>
> {
  return apiRequest('/leads/stats/summary');
}

export interface Persona {
  _id: string;
  name: string;
  role: string;
  keywords: string[];
  negativeKeywords: string[];
  aiTone: 'professional' | 'casual' | 'friendly' | 'expert';
  valueProposition: string;
  signature?: string;
  isActive: boolean;
  createdAt: string;
}

export async function getPersonas(
  activeOnly?: boolean
): Promise<ApiResponse<{ personas: Persona[] }>> {
  const query = activeOnly ? '?activeOnly=true' : '';
  return apiRequest(`/personas${query}`);
}

export async function getActivePersona(): Promise<ApiResponse<{ persona: Persona | null }>> {
  return apiRequest('/personas/active');
}

export async function createPersona(
  persona: Omit<Persona, '_id' | 'createdAt'>
): Promise<ApiResponse<{ persona: Persona }>> {
  return apiRequest('/personas', {
    method: 'POST',
    body: JSON.stringify(persona),
  });
}

export async function updatePersona(
  personaId: string,
  updates: Partial<Persona>
): Promise<ApiResponse<{ persona: Persona }>> {
  return apiRequest(`/personas/${personaId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function activatePersona(
  personaId: string
): Promise<ApiResponse<{ persona: Persona }>> {
  return apiRequest(`/personas/${personaId}/activate`, {
    method: 'POST',
  });
}

export async function deletePersona(personaId: string): Promise<ApiResponse<{ message: string }>> {
  return apiRequest(`/personas/${personaId}`, {
    method: 'DELETE',
  });
}

export interface WatchedGroup {
  _id: string;
  name: string;
  url: string;
  category: string;
  lastVisited?: string;
  leadsFound: number;
  isActive: boolean;
  createdAt: string;
}

export async function getGroups(
  activeOnly?: boolean
): Promise<ApiResponse<{ groups: WatchedGroup[] }>> {
  const query = activeOnly ? '?activeOnly=true' : '';
  return apiRequest(`/groups${query}`);
}

export async function getNextGroupToVisit(): Promise<ApiResponse<{ group: WatchedGroup | null }>> {
  return apiRequest('/groups/next');
}

export async function createGroup(
  group: Omit<WatchedGroup, '_id' | 'createdAt' | 'leadsFound'>
): Promise<ApiResponse<{ group: WatchedGroup }>> {
  return apiRequest('/groups', {
    method: 'POST',
    body: JSON.stringify(group),
  });
}

export async function updateGroup(
  groupId: string,
  updates: Partial<WatchedGroup>
): Promise<ApiResponse<{ group: WatchedGroup }>> {
  return apiRequest(`/groups/${groupId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function recordGroupVisit(
  groupId: string,
  leadsFound?: number
): Promise<ApiResponse<{ group: WatchedGroup }>> {
  return apiRequest(`/groups/${groupId}/visit`, {
    method: 'POST',
    body: JSON.stringify({ leadsFound }),
  });
}

export async function deleteGroup(groupId: string): Promise<ApiResponse<{ message: string }>> {
  return apiRequest(`/groups/${groupId}`, {
    method: 'DELETE',
  });
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

export async function getUsage(): Promise<ApiResponse<UsageInfo>> {
  return apiRequest('/usage');
}

export async function checkUsageLimit(
  type: 'leads' | 'aiCalls'
): Promise<
  ApiResponse<{
    allowed: boolean;
    current: number;
    limit: number;
    remaining: number;
  }>
> {
  return apiRequest('/usage/check', {
    method: 'POST',
    body: JSON.stringify({ type }),
  });
}

export async function incrementUsage(
  type: 'leads' | 'aiCalls',
  amount?: number
): Promise<ApiResponse<{ usage: UsageInfo['usage']; limits: UsageInfo['limits'] }>> {
  return apiRequest('/usage/increment', {
    method: 'POST',
    body: JSON.stringify({ type, amount }),
  });
}

export interface AutomationSettings {
  enabled: boolean;
  scanIntervalMinutes: number;
  groupsPerCycle: number;
  delayMinSeconds: number;
  delayMaxSeconds: number;
  lastScanAt?: string;
}

export async function getAutomationSettings(): Promise<
  ApiResponse<{ settings: AutomationSettings }>
> {
  return apiRequest('/automation/settings');
}

export async function updateAutomationSettings(
  settings: Partial<AutomationSettings>
): Promise<ApiResponse<{ settings: AutomationSettings }>> {
  return apiRequest('/automation/settings', {
    method: 'PATCH',
    body: JSON.stringify(settings),
  });
}

export async function recordScanComplete(): Promise<ApiResponse<{ message: string }>> {
  return apiRequest('/automation/scan-complete', {
    method: 'POST',
  });
}
