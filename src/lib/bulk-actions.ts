import { leadsStorage } from './storage';
import type { Lead, LeadStatus } from '../types';

export interface BulkActionResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: string[];
}

export async function bulkUpdateStatus(
  leadIds: string[],
  status: LeadStatus
): Promise<BulkActionResult> {
  const result: BulkActionResult = {
    success: true,
    processed: 0,
    failed: 0,
    errors: [],
  };

  const leads = await leadsStorage.getValue();
  const updatedLeads = leads.map((lead) => {
    if (leadIds.includes(lead.id)) {
      result.processed++;
      return {
        ...lead,
        status,
        contactedAt: status === 'contacted' ? Date.now() : lead.contactedAt,
      };
    }
    return lead;
  });

  if (result.processed !== leadIds.length) {
    result.failed = leadIds.length - result.processed;
    result.errors.push(`${result.failed} leads not found`);
  }

  await leadsStorage.setValue(updatedLeads);
  result.success = result.failed === 0;
  return result;
}

export async function bulkDeleteLeads(leadIds: string[]): Promise<BulkActionResult> {
  const result: BulkActionResult = {
    success: true,
    processed: 0,
    failed: 0,
    errors: [],
  };

  const leads = await leadsStorage.getValue();
  const filteredLeads = leads.filter((lead) => {
    if (leadIds.includes(lead.id)) {
      result.processed++;
      return false;
    }
    return true;
  });

  if (result.processed !== leadIds.length) {
    result.failed = leadIds.length - result.processed;
    result.errors.push(`${result.failed} leads not found`);
  }

  await leadsStorage.setValue(filteredLeads);
  result.success = result.failed === 0;
  return result;
}

export function exportLeadsToCsv(leads: Lead[]): string {
  const headers = [
    'ID',
    'Author Name',
    'Author Profile URL',
    'Post URL',
    'Post Text',
    'Group Name',
    'Intent',
    'Lead Score',
    'Status',
    'Created At',
    'Contacted At',
    'AI Analysis',
    'AI Draft Reply',
  ];

  const rows = leads.map((lead) => [
    lead.id,
    escapeCSV(lead.authorName),
    lead.authorProfileUrl,
    lead.postUrl,
    escapeCSV(lead.postText.substring(0, 500)),
    escapeCSV(lead.groupName || ''),
    lead.intent,
    lead.leadScore.toString(),
    lead.status,
    new Date(lead.createdAt).toISOString(),
    lead.contactedAt ? new Date(lead.contactedAt).toISOString() : '',
    escapeCSV(lead.aiAnalysis?.reasoning || ''),
    escapeCSV(lead.aiDraftReply || ''),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  return csvContent;
}

export function downloadCsv(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportSelectedLeads(leads: Lead[], selectedIds: string[]): void {
  const selectedLeads = leads.filter((lead) => selectedIds.includes(lead.id));
  const csv = exportLeadsToCsv(selectedLeads);
  const timestamp = new Date().toISOString().split('T')[0];
  downloadCsv(csv, `leadscout-leads-${timestamp}.csv`);
}

export async function getLeadsByIds(leadIds: string[]): Promise<Lead[]> {
  const leads = await leadsStorage.getValue();
  return leads.filter((lead) => leadIds.includes(lead.id));
}

function escapeCSV(value: string): string {
  if (!value) return '""';
  const needsQuotes = value.includes(',') || value.includes('"') || value.includes('\n');
  if (needsQuotes) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function getLeadsNeedingAIReplies(leadIds: string[]): Promise<string[]> {
  const leads = await leadsStorage.getValue();
  return leads
    .filter((lead) => leadIds.includes(lead.id) && !lead.aiDraftReply)
    .map((lead) => lead.id);
}

export type BulkActionType = 
  | 'mark-contacted'
  | 'mark-converted'
  | 'mark-ignored'
  | 'mark-new'
  | 'delete'
  | 'export'
  | 'generate-replies';

export interface BulkActionMessage {
  type: 'BULK_ACTION';
  action: BulkActionType;
  leadIds: string[];
}
