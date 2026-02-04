import { getDb } from '../db/index.js';
import type { ILeadFeedback, LeadFeedbackQuality } from '../types/index.js';

export interface LeadFeedbackRow {
  id: string;
  lead_id: string;
  user_id: string;
  quality: LeadFeedbackQuality;
  reason: string | null;
  created_at: Date;
}

function rowToLeadFeedback(row: LeadFeedbackRow): ILeadFeedback & { id: string } {
  return {
    id: row.id,
    userId: row.user_id,
    leadId: row.lead_id,
    quality: row.quality,
    reason: row.reason ?? undefined,
    createdAt: row.created_at,
  };
}

export const LeadFeedback = {
  async listByLeadId(leadId: string): Promise<(ILeadFeedback & { id: string })[]> {
    const sql = getDb();
    const rows = await sql`
      SELECT * FROM lead_feedback WHERE lead_id = ${leadId} ORDER BY created_at DESC
    `;
    return rows.map((row) => rowToLeadFeedback(row as LeadFeedbackRow));
  },

  async create(data: {
    userId: string;
    leadId: string;
    quality: LeadFeedbackQuality;
    reason?: string;
  }): Promise<ILeadFeedback & { id: string }> {
    const sql = getDb();
    const rows = await sql`
      INSERT INTO lead_feedback (user_id, lead_id, quality, reason)
      VALUES (${data.userId}, ${data.leadId}, ${data.quality}, ${data.reason ?? null})
      RETURNING *
    `;
    return rowToLeadFeedback(rows[0] as LeadFeedbackRow);
  },

  async delete(id: string): Promise<boolean> {
    const sql = getDb();
    const result = await sql`DELETE FROM lead_feedback WHERE id = ${id} RETURNING id`;
    return result.length > 0;
  },
};
