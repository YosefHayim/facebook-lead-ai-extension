import { getDb } from '../db/index.js';
import type { IAutomationRun, AutomationRunStatus } from '../types/index.js';

export interface AutomationRunRow {
  id: string;
  user_id: string;
  status: AutomationRunStatus;
  started_at: Date;
  finished_at: Date | null;
  groups_scanned: number;
  leads_found: number;
  error: string | null;
  created_at: Date;
}

function rowToAutomationRun(row: AutomationRunRow): IAutomationRun & { id: string } {
  return {
    id: row.id,
    userId: row.user_id,
    status: row.status,
    startedAt: row.started_at,
    finishedAt: row.finished_at ?? undefined,
    groupsScanned: row.groups_scanned,
    leadsFound: row.leads_found,
    error: row.error ?? undefined,
    createdAt: row.created_at,
  };
}

export const AutomationRun = {
  async findById(id: string): Promise<(IAutomationRun & { id: string }) | null> {
    const sql = getDb();
    const rows = await sql`SELECT * FROM automation_runs WHERE id = ${id}`;
    if (rows.length === 0) return null;
    return rowToAutomationRun(rows[0] as AutomationRunRow);
  },

  async create(data: { userId: string }): Promise<IAutomationRun & { id: string }> {
    const sql = getDb();
    const rows = await sql`
      INSERT INTO automation_runs (user_id)
      VALUES (${data.userId})
      RETURNING *
    `;
    return rowToAutomationRun(rows[0] as AutomationRunRow);
  },

  async complete(id: string, data: {
    status: AutomationRunStatus;
    groupsScanned: number;
    leadsFound: number;
    error?: string;
  }): Promise<(IAutomationRun & { id: string }) | null> {
    const sql = getDb();
    const rows = await sql`
      UPDATE automation_runs SET
        status = ${data.status},
        finished_at = NOW(),
        groups_scanned = ${data.groupsScanned},
        leads_found = ${data.leadsFound},
        error = ${data.error ?? null}
      WHERE id = ${id}
      RETURNING *
    `;
    if (rows.length === 0) return null;
    return rowToAutomationRun(rows[0] as AutomationRunRow);
  },

  async listByUserId(userId: string, limit = 20): Promise<(IAutomationRun & { id: string })[]> {
    const sql = getDb();
    const rows = await sql`
      SELECT * FROM automation_runs WHERE user_id = ${userId}
      ORDER BY started_at DESC
      LIMIT ${limit}
    `;
    return rows.map((row) => rowToAutomationRun(row as AutomationRunRow));
  },
};
