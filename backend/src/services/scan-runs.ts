import { ScanRun } from '../models/ScanRun.js';
import type { ScanSource } from '../types/index.js';

export async function createScanRun(userId: string, data: {
  source: ScanSource;
  groupId?: string;
  groupName?: string;
}) {
  return ScanRun.create({ userId, ...data });
}

export async function completeScanRun(userId: string, scanId: string, data: {
  postsFound: number;
  leadsDetected: number;
  errors?: Record<string, unknown> | null;
}) {
  const run = await ScanRun.findById(scanId);
  if (!run || run.userId !== userId) return null;
  return ScanRun.complete(scanId, data);
}

export async function listScanRuns(userId: string, limit?: number) {
  return ScanRun.listByUserId(userId, limit ?? 20);
}
