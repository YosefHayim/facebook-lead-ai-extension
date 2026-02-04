import { apiRequest } from './client';
import type { ApiResponse } from './client';
import type { UsageInfo } from './types';

export type { UsageInfo };

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
