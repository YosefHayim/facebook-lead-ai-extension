import { apiRequest } from './client';
import type { ApiResponse } from './client';
import type { AutomationSettings } from './types';

export type { AutomationSettings };

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
