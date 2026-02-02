import { getDb } from '../db/index.js';
import type { IPersona, AITone } from '../types/index.js';

export interface PersonaRow {
  id: string;
  user_id: string;
  name: string;
  role: string;
  keywords: string[];
  negative_keywords: string[];
  ai_tone: AITone;
  value_proposition: string;
  signature: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

function rowToPersona(row: PersonaRow): IPersona & { id: string } {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    role: row.role,
    keywords: row.keywords,
    negativeKeywords: row.negative_keywords,
    aiTone: row.ai_tone,
    valueProposition: row.value_proposition,
    signature: row.signature ?? undefined,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const Persona = {
  async findById(id: string): Promise<(IPersona & { id: string }) | null> {
    const sql = getDb();
    const rows = await sql`SELECT * FROM personas WHERE id = ${id}`;
    if (rows.length === 0) return null;
    return rowToPersona(rows[0] as PersonaRow);
  },

  async findByUserId(
    userId: string,
    options?: { activeOnly?: boolean }
  ): Promise<(IPersona & { id: string })[]> {
    const sql = getDb();
    
    let rows;
    if (options?.activeOnly) {
      rows = await sql`
        SELECT * FROM personas 
        WHERE user_id = ${userId} AND is_active = true
        ORDER BY created_at DESC
      `;
    } else {
      rows = await sql`
        SELECT * FROM personas 
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `;
    }

    return rows.map((row) => rowToPersona(row as PersonaRow));
  },

  async findActivePersona(userId: string): Promise<(IPersona & { id: string }) | null> {
    const sql = getDb();
    const rows = await sql`
      SELECT * FROM personas 
      WHERE user_id = ${userId} AND is_active = true
      LIMIT 1
    `;
    if (rows.length === 0) return null;
    return rowToPersona(rows[0] as PersonaRow);
  },

  async create(data: {
    userId: string;
    name: string;
    role: string;
    keywords?: string[];
    negativeKeywords?: string[];
    aiTone?: AITone;
    valueProposition: string;
    signature?: string;
    isActive?: boolean;
  }): Promise<IPersona & { id: string }> {
    const sql = getDb();
    const rows = await sql`
      INSERT INTO personas (
        user_id, name, role, keywords, negative_keywords,
        ai_tone, value_proposition, signature, is_active
      )
      VALUES (
        ${data.userId}, ${data.name}, ${data.role}, 
        ${data.keywords ?? []}, ${data.negativeKeywords ?? []},
        ${data.aiTone ?? 'professional'}, ${data.valueProposition}, 
        ${data.signature ?? null}, ${data.isActive ?? true}
      )
      RETURNING *
    `;
    return rowToPersona(rows[0] as PersonaRow);
  },

  async update(id: string, data: Partial<{
    name: string;
    role: string;
    keywords: string[];
    negativeKeywords: string[];
    aiTone: AITone;
    valueProposition: string;
    signature: string;
    isActive: boolean;
  }>): Promise<(IPersona & { id: string }) | null> {
    const sql = getDb();
    const rows = await sql`
      UPDATE personas SET
        name = COALESCE(${data.name ?? null}, name),
        role = COALESCE(${data.role ?? null}, role),
        keywords = COALESCE(${data.keywords ?? null}, keywords),
        negative_keywords = COALESCE(${data.negativeKeywords ?? null}, negative_keywords),
        ai_tone = COALESCE(${data.aiTone ?? null}, ai_tone),
        value_proposition = COALESCE(${data.valueProposition ?? null}, value_proposition),
        signature = COALESCE(${data.signature ?? null}, signature),
        is_active = COALESCE(${data.isActive ?? null}, is_active)
      WHERE id = ${id}
      RETURNING *
    `;
    if (rows.length === 0) return null;
    return rowToPersona(rows[0] as PersonaRow);
  },

  async activate(id: string, userId: string): Promise<(IPersona & { id: string }) | null> {
    const sql = getDb();
    
    await sql`UPDATE personas SET is_active = false WHERE user_id = ${userId}`;
    
    const rows = await sql`
      UPDATE personas SET is_active = true
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING *
    `;
    if (rows.length === 0) return null;
    return rowToPersona(rows[0] as PersonaRow);
  },

  async delete(id: string): Promise<boolean> {
    const sql = getDb();
    const result = await sql`DELETE FROM personas WHERE id = ${id} RETURNING id`;
    return result.length > 0;
  },
};
