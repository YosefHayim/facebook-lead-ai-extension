import { getDb } from '../db/index.js';
import type { ILeadContext } from '../types/index.js';

export interface LeadContextRow {
  id: string;
  lead_id: string;
  user_id: string;
  lci: Record<string, unknown>;
  confidence_score: number;
  fetched_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

function rowToLeadContext(row: LeadContextRow): ILeadContext & { id: string } {
  return {
    id: row.id,
    userId: row.user_id,
    leadId: row.lead_id,
    lci: row.lci,
    confidenceScore: row.confidence_score,
    fetchedAt: row.fetched_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const LeadContext = {
  async findByLeadId(leadId: string): Promise<(ILeadContext & { id: string }) | null> {
    const sql = getDb();
    const rows = await sql`SELECT * FROM lead_context WHERE lead_id = ${leadId}`;
    if (rows.length === 0) return null;
    return rowToLeadContext(rows[0] as LeadContextRow);
  },

  async upsert(data: {
    userId: string;
    leadId: string;
    lci: Record<string, unknown>;
    confidenceScore: number;
    fetchedAt?: Date;
  }): Promise<ILeadContext & { id: string }> {
    const sql = getDb();
    const rows = await sql`
      INSERT INTO lead_context (user_id, lead_id, lci, confidence_score, fetched_at)
      VALUES (
        ${data.userId},
        ${data.leadId},
        ${JSON.stringify(data.lci)}::jsonb,
        ${data.confidenceScore},
        ${data.fetchedAt ?? null}
      )
      ON CONFLICT (lead_id) DO UPDATE SET
        lci = EXCLUDED.lci,
        confidence_score = EXCLUDED.confidence_score,
        fetched_at = EXCLUDED.fetched_at
      RETURNING *
    `;
    return rowToLeadContext(rows[0] as LeadContextRow);
  },
};
