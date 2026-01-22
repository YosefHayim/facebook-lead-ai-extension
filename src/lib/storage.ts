import { storage } from 'wxt/storage';
import type { Persona, Lead, ExtensionSettings, UsageData, WatchedGroup, SessionLimits, ResponseTracking, LeadFeedback } from '../types';

export const personasStorage = storage.defineItem<Persona[]>(
  'local:personas',
  {
    fallback: [
      {
        id: 'default',
        name: 'Default Persona',
        role: 'Professional',
        keywords: ['looking for', 'need help', 'recommend', 'suggestions', 'anyone know'],
        negativeKeywords: ['hiring', 'job posting', 'we are hiring'],
        aiTone: 'professional',
        valueProposition: 'I help businesses solve their problems with tailored solutions.',
        isActive: true,
        createdAt: Date.now(),
      },
    ],
    version: 1,
  }
);

export const activePersonaIdStorage = storage.defineItem<string>(
  'local:activePersonaId',
  { fallback: 'default' }
);

export const leadsStorage = storage.defineItem<Lead[]>(
  'local:leads',
  {
    fallback: [],
    version: 1,
  }
);

export const settingsStorage = storage.defineItem<ExtensionSettings>(
  'local:settings',
  {
    fallback: {
      isEnabled: true,
      scanMode: 'manual',
      scanIntervalMs: 10000,
      minLeadScore: 50,
      autoAnalyze: true,
      showOverlay: true,
      aiProvider: 'gemini',
      transparencyEnabled: false,
      transparencyText: '[AI-assisted response]',
    },
    version: 3,
  }
);

export const watchedGroupsStorage = storage.defineItem<WatchedGroup[]>(
  'local:watchedGroups',
  {
    fallback: [],
    version: 1,
  }
);

export const sessionLimitsStorage = storage.defineItem<SessionLimits>(
  'local:sessionLimits',
  {
    fallback: {
      maxPostsPerHour: 30,
      maxGroupsPerDay: 10,
      cooldownMinutes: 15,
      postsScannedThisHour: 0,
      groupsVisitedToday: 0,
      lastHourReset: Date.now(),
      lastDayReset: new Date().toDateString(),
      isPaused: false,
    },
    version: 1,
  }
);

export const usageStorage = storage.defineItem<UsageData>(
  'local:usage',
  {
    fallback: {
      leadsFoundToday: 0,
      aiCallsToday: 0,
      lastResetDate: new Date().toDateString(),
    },
  }
);

export const seenPostIdsStorage = storage.defineItem<string[]>(
  'local:seenPostIds',
  { fallback: [] }
);

export const onboardingCompleteStorage = storage.defineItem<boolean>(
  'local:onboardingComplete',
  { fallback: false }
);

export async function addLead(lead: Lead): Promise<void> {
  const leads = await leadsStorage.getValue();
  const existingIndex = leads.findIndex(l => l.postUrl === lead.postUrl);
  
  if (existingIndex >= 0) {
    leads[existingIndex] = { ...leads[existingIndex], ...lead };
  } else {
    leads.unshift(lead);
  }
  
  await leadsStorage.setValue(leads.slice(0, 500));
}

export async function updateLeadStatus(leadId: string, status: Lead['status']): Promise<void> {
  const leads = await leadsStorage.getValue();
  const index = leads.findIndex(l => l.id === leadId);
  
  if (index >= 0) {
    leads[index].status = status;
    if (status === 'contacted') {
      leads[index].contactedAt = Date.now();
    }
    await leadsStorage.setValue(leads);
  }
}

export async function updateLeadResponse(leadId: string, tracking: Partial<ResponseTracking>): Promise<void> {
  const leads = await leadsStorage.getValue();
  const index = leads.findIndex(l => l.id === leadId);
  
  if (index >= 0) {
    leads[index].responseTracking = {
      ...leads[index].responseTracking,
      responded: false,
      ...tracking,
    };
    await leadsStorage.setValue(leads);
  }
}

export async function updateLeadFeedback(leadId: string, feedback: LeadFeedback): Promise<void> {
  const leads = await leadsStorage.getValue();
  const index = leads.findIndex(l => l.id === leadId);
  
  if (index >= 0) {
    leads[index].feedback = feedback;
    await leadsStorage.setValue(leads);
  }
}

export async function getLeadStats(): Promise<{
  total: number;
  responded: number;
  gotReplies: number;
  converted: number;
  goodLeads: number;
  badLeads: number;
}> {
  const leads = await leadsStorage.getValue();
  
  return {
    total: leads.length,
    responded: leads.filter(l => l.responseTracking?.responded).length,
    gotReplies: leads.filter(l => l.responseTracking?.gotReply).length,
    converted: leads.filter(l => l.status === 'converted').length,
    goodLeads: leads.filter(l => l.feedback?.quality === 'good').length,
    badLeads: leads.filter(l => l.feedback?.quality === 'bad').length,
  };
}

export async function getActivePersona(): Promise<Persona | null> {
  const personas = await personasStorage.getValue();
  const activeId = await activePersonaIdStorage.getValue();
  return personas.find(p => p.id === activeId) ?? personas[0] ?? null;
}

export async function incrementUsage(type: 'lead' | 'aiCall'): Promise<boolean> {
  const usage = await usageStorage.getValue();
  const today = new Date().toDateString();
  
  if (usage.lastResetDate !== today) {
    await usageStorage.setValue({
      leadsFoundToday: type === 'lead' ? 1 : 0,
      aiCallsToday: type === 'aiCall' ? 1 : 0,
      lastResetDate: today,
    });
    return true;
  }
  
  await usageStorage.setValue({
    ...usage,
    leadsFoundToday: usage.leadsFoundToday + (type === 'lead' ? 1 : 0),
    aiCallsToday: usage.aiCallsToday + (type === 'aiCall' ? 1 : 0),
  });
  
  return true;
}

export async function checkSessionLimits(): Promise<{ canProceed: boolean; reason?: string }> {
  const limits = await sessionLimitsStorage.getValue();
  const now = Date.now();
  const today = new Date().toDateString();
  const oneHourAgo = now - 60 * 60 * 1000;

  if (limits.isPaused && limits.pausedUntil && now < limits.pausedUntil) {
    const minutesLeft = Math.ceil((limits.pausedUntil - now) / 60000);
    return { canProceed: false, reason: `Paused for ${minutesLeft} more minutes` };
  }

  let updated = { ...limits };
  
  if (limits.lastHourReset < oneHourAgo) {
    updated.postsScannedThisHour = 0;
    updated.lastHourReset = now;
  }
  
  if (limits.lastDayReset !== today) {
    updated.groupsVisitedToday = 0;
    updated.lastDayReset = today;
  }

  updated.isPaused = false;
  updated.pausedUntil = undefined;

  if (updated.postsScannedThisHour >= limits.maxPostsPerHour) {
    updated.isPaused = true;
    updated.pausedUntil = now + limits.cooldownMinutes * 60 * 1000;
    await sessionLimitsStorage.setValue(updated);
    return { canProceed: false, reason: `Hourly limit reached (${limits.maxPostsPerHour} posts). Cooling down.` };
  }

  await sessionLimitsStorage.setValue(updated);
  return { canProceed: true };
}

export async function incrementSessionUsage(type: 'post' | 'group'): Promise<void> {
  const limits = await sessionLimitsStorage.getValue();
  
  if (type === 'post') {
    limits.postsScannedThisHour += 1;
  } else {
    limits.groupsVisitedToday += 1;
  }
  
  await sessionLimitsStorage.setValue(limits);
}

export async function addWatchedGroup(group: Omit<WatchedGroup, 'id' | 'createdAt' | 'leadsFound'>): Promise<WatchedGroup> {
  const groups = await watchedGroupsStorage.getValue();
  
  const existingIndex = groups.findIndex(g => g.url === group.url);
  if (existingIndex >= 0) {
    return groups[existingIndex];
  }
  
  const newGroup: WatchedGroup = {
    ...group,
    id: `group_${Date.now()}`,
    leadsFound: 0,
    createdAt: Date.now(),
  };
  
  groups.push(newGroup);
  await watchedGroupsStorage.setValue(groups);
  return newGroup;
}

export async function updateWatchedGroup(groupId: string, updates: Partial<WatchedGroup>): Promise<void> {
  const groups = await watchedGroupsStorage.getValue();
  const index = groups.findIndex(g => g.id === groupId);
  
  if (index >= 0) {
    groups[index] = { ...groups[index], ...updates };
    await watchedGroupsStorage.setValue(groups);
  }
}

export async function removeWatchedGroup(groupId: string): Promise<void> {
  const groups = await watchedGroupsStorage.getValue();
  await watchedGroupsStorage.setValue(groups.filter(g => g.id !== groupId));
}

export async function getNextGroupToVisit(): Promise<WatchedGroup | null> {
  const groups = await watchedGroupsStorage.getValue();
  const activeGroups = groups.filter(g => g.isActive);
  
  if (activeGroups.length === 0) return null;
  
  activeGroups.sort((a, b) => (a.lastVisited || 0) - (b.lastVisited || 0));
  return activeGroups[0];
}
