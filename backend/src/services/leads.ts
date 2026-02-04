import { Lead } from '../models/Lead.js';
import { User } from '../models/User.js';
import type { IntentType, LeadStatus } from '../types/index.js';

export async function listLeads(userId: string, options?: {
  status?: LeadStatus;
  limit?: number;
  skip?: number;
}) {
  const leads = await Lead.findByUserId(userId, options);
  const total = await Lead.countByUserId(userId, { status: options?.status });
  return { leads, total };
}

export async function createLead(userId: string, leadData: {
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
}) {
  const user = await User.findById(userId);
  if (!user) return { error: 'User not found' as const };

  if (!User.isWithinLimits(user, 'leads')) {
    return { error: 'Monthly lead limit reached' as const };
  }

  const lead = await Lead.createWithUsage({ ...leadData, userId });
  if (!lead) {
    return { error: 'Lead already exists' as const };
  }

  return { lead };
}

export async function createLeadsBulk(userId: string, leadsData: Array<{
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
}>) {
  const user = await User.findById(userId);
  if (!user) return { error: 'User not found' as const };

  const remaining = user.limits.leadsPerMonth - user.usage.leadsFoundThisMonth;
  if (remaining <= 0) {
    return { leads: [], created: 0, skipped: leadsData.length };
  }

  const toCreate = leadsData.slice(0, remaining);
  const result = await Lead.createBulkWithUsage({ userId, leads: toCreate });

  return {
    leads: result.leads,
    created: result.created,
    skipped: leadsData.length - result.created,
  };
}

export async function getLeadStats(userId: string) {
  return Lead.getStats(userId);
}

export async function getLeadById(userId: string, leadId: string) {
  const lead = await Lead.findById(leadId);
  if (!lead || lead.userId !== userId) return null;
  return lead;
}

export async function updateLead(userId: string, leadId: string, updates: Partial<{
  status: LeadStatus;
  aiDraftReply: string;
  responseTracking: {
    responded: boolean;
    responseText?: string;
    respondedAt?: Date;
    gotReply?: boolean;
    repliedAt?: Date;
  };
}>) {
  const existing = await Lead.findById(leadId);
  if (!existing || existing.userId !== userId) return null;
  return Lead.update(leadId, updates);
}

export async function deleteLead(userId: string, leadId: string): Promise<boolean> {
  const existing = await Lead.findById(leadId);
  if (!existing || existing.userId !== userId) return false;
  return Lead.delete(leadId);
}
