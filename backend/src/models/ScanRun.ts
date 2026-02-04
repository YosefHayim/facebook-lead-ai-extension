import { getDb } from '../db/index.js';
import type { IScanRun, ScanSource } from '../types/index.js';

export interface ScanRunRow {
  id: string;
  user_id: string;
  source: ScanSource;
  group_id: string | null;
  group_name: string | null;
  started_at: Date;
  finished_at: Date | null;
  posts_found: number;
  leads_detected: number;
  errors: Record<string, unknown> | null;
  created_at: Date;
}

function rowToScanRun(row: ScanRunRow): IScanRun & { id: string } {
  return {
    id: row.id,
    userId: row.user_id,
    source: row.source,
    groupId: row.group_id ?? undefined,
    groupName: row.group_name ?? undefined,
    startedAt: row.started_at,
    finishedAt: row.finished_at ?? undefined,
    postsFound: row.posts_found,
    leadsDetected: row.leads_detected,
    errors: row.errors ?? undefined,
    createdAt: row.created_at,
  };
}

export const ScanRun = {
  async findById(id: string): Promise<(IScanRun & { id: string }) | null> {
    const sql = getDb();
    const rows = await sql`SELECT * FROM scan_runs WHERE id = ${id}`;
    if (rows.length === 0) return null;
    return rowToScanRun(rows[0] as ScanRunRow);
  },

  async create(data: {
    userId: string;
    source: ScanSource;
    groupId?: string;
    groupName?: string;
  }): Promise<IScanRun & { id: string }> {
    const sql = getDb();
    const rows = await sql`
      INSERT INTO scan_runs (user_id, source, group_id, group_name)
      VALUES (${data.userId}, ${data.source}, ${data.groupId ?? null}, ${data.groupName ?? null})
      RETURNING *
    `;
    return rowToScanRun(rows[0] as ScanRunRow);
  },

  async complete(id: string, data: {
    postsFound: number;
    leadsDetected: number;
    errors?: Record<string, unknown> | null;
  }): Promise<(IScanRun & { id: string }) | null> {
    const sql = getDb();
    const rows = await sql`
      UPDATE scan_runs SET
        finished_at = NOW(),
        posts_found = ${data.postsFound},
        leads_detected = ${data.leadsDetected},
        errors = ${data.errors ? JSON.stringify(data.errors) : null}::jsonb
      WHERE id = ${id}
      RETURNING *
    `;
    if (rows.length === 0) return null;
    return rowToScanRun(rows[0] as ScanRunRow);
  },

  async listByUserId(userId: string, limit = 20): Promise<(IScanRun & { id: string })[]> {
    const sql = getDb();
    const rows = await sql`
      SELECT * FROM scan_runs WHERE user_id = ${userId}
      ORDER BY started_at DESC
      LIMIT ${limit}
    `;
    return rows.map((row) => rowToScanRun(row as ScanRunRow));
  },
};
