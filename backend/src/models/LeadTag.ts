import { getDb } from '../db/index.js';
import type { ILeadTag } from '../types/index.js';

export interface LeadTagRow {
  id: string;
  lead_id: string;
  user_id: string;
  tag: string;
  created_at: Date;
}

function rowToLeadTag(row: LeadTagRow): ILeadTag & { id: string } {
  return {
    id: row.id,
    userId: row.user_id,
    leadId: row.lead_id,
    tag: row.tag,
    createdAt: row.created_at,
  };
}

export const LeadTag = {
  async listByLeadId(leadId: string): Promise<(ILeadTag & { id: string })[]> {
    const sql = getDb();
    const rows = await sql`
      SELECT * FROM lead_tags WHERE lead_id = ${leadId} ORDER BY created_at DESC
    `;
    return rows.map((row) => rowToLeadTag(row as LeadTagRow));
  },

  async addTags(data: { userId: string; leadId: string; tags: string[] }): Promise<(ILeadTag & { id: string })[]> {
    if (data.tags.length === 0) return [];
    const sql = getDb();
    const rows = await sql`
      INSERT INTO lead_tags (user_id, lead_id, tag)
      SELECT ${data.userId}, ${data.leadId}, UNNEST(${data.tags}::text[])
      ON CONFLICT (lead_id, tag) DO NOTHING
      RETURNING *
    `;
    return rows.map((row) => rowToLeadTag(row as LeadTagRow));
  },

  async delete(id: string): Promise<boolean> {
    const sql = getDb();
    const result = await sql`DELETE FROM lead_tags WHERE id = ${id} RETURNING id`;
    return result.length > 0;
  },

  async deleteByLeadId(leadId: string): Promise<number> {
    const sql = getDb();
    const result = await sql`DELETE FROM lead_tags WHERE lead_id = ${leadId} RETURNING id`;
    return result.length;
  },
};
