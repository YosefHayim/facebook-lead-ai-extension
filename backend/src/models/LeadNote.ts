import { getDb } from '../db/index.js';
import type { ILeadNote } from '../types/index.js';

export interface LeadNoteRow {
  id: string;
  lead_id: string;
  user_id: string;
  note: string;
  created_at: Date;
}

function rowToLeadNote(row: LeadNoteRow): ILeadNote & { id: string } {
  return {
    id: row.id,
    userId: row.user_id,
    leadId: row.lead_id,
    note: row.note,
    createdAt: row.created_at,
  };
}

export const LeadNote = {
  async listByLeadId(leadId: string): Promise<(ILeadNote & { id: string })[]> {
    const sql = getDb();
    const rows = await sql`
      SELECT * FROM lead_notes WHERE lead_id = ${leadId} ORDER BY created_at DESC
    `;
    return rows.map((row) => rowToLeadNote(row as LeadNoteRow));
  },

  async create(data: { userId: string; leadId: string; note: string }): Promise<ILeadNote & { id: string }> {
    const sql = getDb();
    const rows = await sql`
      INSERT INTO lead_notes (user_id, lead_id, note)
      VALUES (${data.userId}, ${data.leadId}, ${data.note})
      RETURNING *
    `;
    return rowToLeadNote(rows[0] as LeadNoteRow);
  },

  async delete(id: string): Promise<boolean> {
    const sql = getDb();
    const result = await sql`DELETE FROM lead_notes WHERE id = ${id} RETURNING id`;
    return result.length > 0;
  },
};
