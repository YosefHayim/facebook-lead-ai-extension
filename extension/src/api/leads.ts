import { apiRequest } from './client';
import type { ApiResponse } from './client';
import type { ApiLead, CreateLeadInput } from './types';

export type { ApiLead, CreateLeadInput };

export async function getLeads(options?: {
  status?: string;
  limit?: number;
  skip?: number;
}): Promise<ApiResponse<{ leads: ApiLead[]; total: number }>> {
  const params = new URLSearchParams();
  if (options?.status) params.set('status', options.status);
  if (options?.limit) params.set('limit', options.limit.toString());
  if (options?.skip) params.set('skip', options.skip.toString());

  const query = params.toString();
  return apiRequest(`/leads${query ? `?${query}` : ''}`);
}

export async function createLead(
  lead: CreateLeadInput
): Promise<ApiResponse<{ lead: ApiLead }>> {
  return apiRequest('/leads', {
    method: 'POST',
    body: JSON.stringify(lead),
  });
}

export async function createLeadsBulk(
  leads: CreateLeadInput[]
): Promise<ApiResponse<{ leads: ApiLead[]; created: number; skipped: number }>> {
  return apiRequest('/leads/bulk', {
    method: 'POST',
    body: JSON.stringify({ leads }),
  });
}

export async function updateLead(
  leadId: string,
  updates: Partial<ApiLead>
): Promise<ApiResponse<{ lead: ApiLead }>> {
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
