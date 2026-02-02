import { getDb } from '../db/index.js';
import type { IAutomationSettings } from '../types/index.js';

export interface AutomationSettingsRow {
  id: string;
  user_id: string;
  enabled: boolean;
  scan_interval_minutes: number;
  groups_per_cycle: number;
  delay_min_seconds: number;
  delay_max_seconds: number;
  last_scan_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

function rowToAutomationSettings(row: AutomationSettingsRow): IAutomationSettings & { id: string } {
  return {
    id: row.id,
    userId: row.user_id,
    enabled: row.enabled,
    scanIntervalMinutes: row.scan_interval_minutes,
    groupsPerCycle: row.groups_per_cycle,
    delayMinSeconds: row.delay_min_seconds,
    delayMaxSeconds: row.delay_max_seconds,
    lastScanAt: row.last_scan_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const AutomationSettings = {
  async findById(id: string): Promise<(IAutomationSettings & { id: string }) | null> {
    const sql = getDb();
    const rows = await sql`SELECT * FROM automation_settings WHERE id = ${id}`;
    if (rows.length === 0) return null;
    return rowToAutomationSettings(rows[0] as AutomationSettingsRow);
  },

  async findByUserId(userId: string): Promise<(IAutomationSettings & { id: string }) | null> {
    const sql = getDb();
    const rows = await sql`SELECT * FROM automation_settings WHERE user_id = ${userId}`;
    if (rows.length === 0) return null;
    return rowToAutomationSettings(rows[0] as AutomationSettingsRow);
  },

  async findOrCreate(userId: string): Promise<IAutomationSettings & { id: string }> {
    const existing = await AutomationSettings.findByUserId(userId);
    if (existing) return existing;
    
    const sql = getDb();
    const rows = await sql`
      INSERT INTO automation_settings (user_id)
      VALUES (${userId})
      RETURNING *
    `;
    return rowToAutomationSettings(rows[0] as AutomationSettingsRow);
  },

  async update(id: string, data: Partial<{
    enabled: boolean;
    scanIntervalMinutes: number;
    groupsPerCycle: number;
    delayMinSeconds: number;
    delayMaxSeconds: number;
    lastScanAt: Date;
  }>): Promise<(IAutomationSettings & { id: string }) | null> {
    const sql = getDb();
    const rows = await sql`
      UPDATE automation_settings SET
        enabled = COALESCE(${data.enabled ?? null}, enabled),
        scan_interval_minutes = COALESCE(${data.scanIntervalMinutes ?? null}, scan_interval_minutes),
        groups_per_cycle = COALESCE(${data.groupsPerCycle ?? null}, groups_per_cycle),
        delay_min_seconds = COALESCE(${data.delayMinSeconds ?? null}, delay_min_seconds),
        delay_max_seconds = COALESCE(${data.delayMaxSeconds ?? null}, delay_max_seconds),
        last_scan_at = COALESCE(${data.lastScanAt ?? null}, last_scan_at)
      WHERE id = ${id}
      RETURNING *
    `;
    if (rows.length === 0) return null;
    return rowToAutomationSettings(rows[0] as AutomationSettingsRow);
  },

  async updateByUserId(userId: string, data: Partial<{
    enabled: boolean;
    scanIntervalMinutes: number;
    groupsPerCycle: number;
    delayMinSeconds: number;
    delayMaxSeconds: number;
    lastScanAt: Date;
  }>): Promise<(IAutomationSettings & { id: string }) | null> {
    const sql = getDb();
    const rows = await sql`
      UPDATE automation_settings SET
        enabled = COALESCE(${data.enabled ?? null}, enabled),
        scan_interval_minutes = COALESCE(${data.scanIntervalMinutes ?? null}, scan_interval_minutes),
        groups_per_cycle = COALESCE(${data.groupsPerCycle ?? null}, groups_per_cycle),
        delay_min_seconds = COALESCE(${data.delayMinSeconds ?? null}, delay_min_seconds),
        delay_max_seconds = COALESCE(${data.delayMaxSeconds ?? null}, delay_max_seconds),
        last_scan_at = COALESCE(${data.lastScanAt ?? null}, last_scan_at)
      WHERE user_id = ${userId}
      RETURNING *
    `;
    if (rows.length === 0) return null;
    return rowToAutomationSettings(rows[0] as AutomationSettingsRow);
  },

  async updateLastScan(userId: string): Promise<void> {
    const sql = getDb();
    await sql`UPDATE automation_settings SET last_scan_at = NOW() WHERE user_id = ${userId}`;
  },

  async delete(id: string): Promise<boolean> {
    const sql = getDb();
    const result = await sql`DELETE FROM automation_settings WHERE id = ${id} RETURNING id`;
    return result.length > 0;
  },
};
