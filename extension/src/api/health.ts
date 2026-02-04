import { apiRequest } from './client';
import type { ApiResponse } from './client';

export async function checkHealth(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
  return apiRequest('/health');
}
