import { AutomationRun } from '../models/AutomationRun.js';
import type { AutomationRunStatus } from '../types/index.js';

export async function createAutomationRun(userId: string) {
  return AutomationRun.create({ userId });
}

export async function completeAutomationRun(userId: string, runId: string, data: {
  status: AutomationRunStatus;
  groupsScanned: number;
  leadsFound: number;
  error?: string;
}) {
  const run = await AutomationRun.findById(runId);
  if (!run || run.userId !== userId) return null;
  return AutomationRun.complete(runId, data);
}

export async function listAutomationRuns(userId: string, limit?: number) {
  return AutomationRun.listByUserId(userId, limit ?? 20);
}
