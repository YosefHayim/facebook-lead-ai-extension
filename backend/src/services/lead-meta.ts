import { Lead } from '../models/Lead.js';
import { LeadFeedback } from '../models/LeadFeedback.js';
import { LeadContext } from '../models/LeadContext.js';
import { LeadNote } from '../models/LeadNote.js';
import { LeadTag } from '../models/LeadTag.js';
import type { LeadFeedbackQuality } from '../types/index.js';

async function ensureLeadOwned(userId: string, leadId: string) {
  const lead = await Lead.findById(leadId);
  if (!lead || lead.userId !== userId) return null;
  return lead;
}

export async function listLeadFeedback(userId: string, leadId: string) {
  const lead = await ensureLeadOwned(userId, leadId);
  if (!lead) return null;
  return LeadFeedback.listByLeadId(leadId);
}

export async function createLeadFeedback(userId: string, leadId: string, data: {
  quality: LeadFeedbackQuality;
  reason?: string;
}) {
  const lead = await ensureLeadOwned(userId, leadId);
  if (!lead) return null;
  return LeadFeedback.create({ userId, leadId, ...data });
}

export async function deleteLeadFeedback(userId: string, leadId: string, feedbackId: string) {
  const lead = await ensureLeadOwned(userId, leadId);
  if (!lead) return null;
  return LeadFeedback.delete(feedbackId);
}

export async function getLeadContext(userId: string, leadId: string) {
  const lead = await ensureLeadOwned(userId, leadId);
  if (!lead) return null;
  return LeadContext.findByLeadId(leadId);
}

export async function upsertLeadContext(userId: string, leadId: string, data: {
  lci: Record<string, unknown>;
  confidenceScore: number;
  fetchedAt?: Date;
}) {
  const lead = await ensureLeadOwned(userId, leadId);
  if (!lead) return null;
  return LeadContext.upsert({ userId, leadId, ...data });
}

export async function listLeadNotes(userId: string, leadId: string) {
  const lead = await ensureLeadOwned(userId, leadId);
  if (!lead) return null;
  return LeadNote.listByLeadId(leadId);
}

export async function createLeadNote(userId: string, leadId: string, note: string) {
  const lead = await ensureLeadOwned(userId, leadId);
  if (!lead) return null;
  return LeadNote.create({ userId, leadId, note });
}

export async function deleteLeadNote(userId: string, leadId: string, noteId: string) {
  const lead = await ensureLeadOwned(userId, leadId);
  if (!lead) return null;
  return LeadNote.delete(noteId);
}

export async function listLeadTags(userId: string, leadId: string) {
  const lead = await ensureLeadOwned(userId, leadId);
  if (!lead) return null;
  return LeadTag.listByLeadId(leadId);
}

export async function addLeadTags(userId: string, leadId: string, tags: string[]) {
  const lead = await ensureLeadOwned(userId, leadId);
  if (!lead) return null;
  return LeadTag.addTags({ userId, leadId, tags });
}

export async function deleteLeadTag(userId: string, leadId: string, tagId: string) {
  const lead = await ensureLeadOwned(userId, leadId);
  if (!lead) return null;
  return LeadTag.delete(tagId);
}
