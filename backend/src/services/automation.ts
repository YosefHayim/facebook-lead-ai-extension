import { AutomationSettings } from '../models/AutomationSettings.js';

export async function getAutomationSettings(userId: string) {
  return AutomationSettings.findOrCreate(userId);
}

export async function updateAutomationSettings(userId: string, updates: Partial<{
  enabled: boolean;
  scanIntervalMinutes: number;
  groupsPerCycle: number;
  delayMinSeconds: number;
  delayMaxSeconds: number;
  lastScanAt: Date;
}>) {
  let settings = await AutomationSettings.findByUserId(userId);
  if (!settings) {
    settings = await AutomationSettings.findOrCreate(userId);
  }
  return AutomationSettings.updateByUserId(userId, updates);
}

export async function recordScanComplete(userId: string) {
  await AutomationSettings.updateLastScan(userId);
}
