export type IntentType =
  | 'seeking_service'
  | 'hiring'
  | 'complaining'
  | 'recommendation'
  | 'discussion'
  | 'selling'
  | 'irrelevant';

export type LeadStatus = 'new' | 'contacted' | 'converted' | 'ignored';

export type AITone = 'professional' | 'casual' | 'friendly' | 'expert';

export interface Persona {
  id: string;
  name: string;
  role: string;
  keywords: string[];
  negativeKeywords: string[];
  aiTone: AITone;
  valueProposition: string;
  signature?: string;
  isActive: boolean;
  createdAt: number;
}

export interface Lead {
  id: string;
  personaId: string;
  postUrl: string;
  postText: string;
  authorName: string;
  authorProfileUrl: string;
  groupName?: string;
  intent: IntentType;
  leadScore: number;
  aiAnalysis?: AIAnalysis;
  aiDraftReply?: string;
  status: LeadStatus;
  createdAt: number;
  contactedAt?: number;
  responseTracking?: ResponseTracking;
  feedback?: LeadFeedback;
  lci?: LeadContextIntelligence;
}

export interface ResponseTracking {
  responded: boolean;
  responseText?: string;
  respondedAt?: number;
  gotReply?: boolean;
  repliedAt?: number;
  convertedToConversation?: boolean;
}

export interface LeadFeedback {
  quality: 'good' | 'bad' | 'neutral';
  reason?: string;
  givenAt: number;
}

export interface AIAnalysis {
  intent: IntentType;
  confidence: number;
  reasoning: string;
  leadScore: number;
  keywords: string[];
}

export interface ParsedPost {
  id: string;
  text: string;
  authorName: string;
  authorProfileUrl: string;
  postUrl: string;
  groupName?: string;
  timestamp?: number;
  element: HTMLElement;
}

export type ScanMode = 'manual' | 'auto';

export interface ExtensionSettings {
  isEnabled: boolean;
  scanMode: ScanMode;
  scanIntervalMs: number;
  minLeadScore: number;
  autoAnalyze: boolean;
  showOverlay: boolean;
  aiProvider: 'gemini' | 'openai';
  transparencyEnabled: boolean;
  transparencyText: string;
}

export interface WatchedGroup {
  id: string;
  name: string;
  url: string;
  category: string;
  lastVisited?: number;
  leadsFound: number;
  isActive: boolean;
  createdAt: number;
}

export interface SessionLimits {
  maxPostsPerHour: number;
  maxGroupsPerDay: number;
  cooldownMinutes: number;
  postsScannedThisHour: number;
  groupsVisitedToday: number;
  lastHourReset: number;
  lastDayReset: string;
  isPaused: boolean;
  pausedUntil?: number;
}

export interface ScanResult {
  postsFound: number;
  leadsDetected: number;
  errors: string[];
  timestamp: number;
}

export interface UsageData {
  leadsFoundToday: number;
  aiCallsToday: number;
  lastResetDate: string;
}

export interface UserSubscription {
  plan: 'free' | 'pro' | 'agency';
  leadsLimit: number;
  aiCallsLimit: number;
}

export const FREE_TIER_LIMITS: UserSubscription = {
  plan: 'free',
  leadsLimit: 5,
  aiCallsLimit: 20,
};

export const PRO_TIER_LIMITS: UserSubscription = {
  plan: 'pro',
  leadsLimit: Infinity,
  aiCallsLimit: 500,
};

export interface AutomationSettings {
  enabled: boolean;
  scanIntervalMinutes: number;
  groupsPerCycle: number;
  delayMinSeconds: number;
  delayMaxSeconds: number;
  lastScanAt?: number;
  isPro: boolean;
}

export interface ScheduledTask {
  id: string;
  type: 'scan_group' | 'process_leads';
  groupId?: string;
  groupName?: string;
  scheduledAt: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: number;
}

export interface AutomationState {
  isRunning: boolean;
  currentTaskId?: string;
  queue: ScheduledTask[];
  completedCount: number;
  failedCount: number;
  startedAt?: number;
}

export interface LeadContextIntelligence {
  fetchedAt: number;
  profileName?: string;
  profileBio?: string;
  location?: string;
  workplace?: string;
  education?: string;
  followers?: number;
  friends?: number;
  joinedDate?: string;
  recentActivity?: ProfileActivity[];
  commonGroups?: string[];
  interests?: string[];
  contactInfo?: {
    email?: string;
    phone?: string;
    website?: string;
  };
  aiSummary?: string;
  confidenceScore: number;
}

export interface ProfileActivity {
  type: 'post' | 'comment' | 'like' | 'share';
  text?: string;
  timestamp?: number;
  groupName?: string;
}
