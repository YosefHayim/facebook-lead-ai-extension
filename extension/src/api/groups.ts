import { apiRequest } from './client';
import type { ApiResponse } from './client';
import type { ApiWatchedGroup, CreateGroupInput } from './types';

export type { ApiWatchedGroup, CreateGroupInput };

export async function getGroups(
  activeOnly?: boolean
): Promise<ApiResponse<{ groups: ApiWatchedGroup[] }>> {
  const query = activeOnly ? '?activeOnly=true' : '';
  return apiRequest(`/groups${query}`);
}

export async function getNextGroupToVisit(): Promise<ApiResponse<{ group: ApiWatchedGroup | null }>> {
  return apiRequest('/groups/next');
}

export async function createGroup(
  group: CreateGroupInput
): Promise<ApiResponse<{ group: ApiWatchedGroup }>> {
  return apiRequest('/groups', {
    method: 'POST',
    body: JSON.stringify(group),
  });
}

export async function updateGroup(
  groupId: string,
  updates: Partial<ApiWatchedGroup>
): Promise<ApiResponse<{ group: ApiWatchedGroup }>> {
  return apiRequest(`/groups/${groupId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function recordGroupVisit(
  groupId: string,
  leadsFound?: number
): Promise<ApiResponse<{ group: ApiWatchedGroup }>> {
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
