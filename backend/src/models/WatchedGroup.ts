import { getDb } from '../db/index.js';
import type { IWatchedGroup } from '../types/index.js';

export interface WatchedGroupRow {
  id: string;
  user_id: string;
  name: string;
  url: string;
  category: string;
  last_visited: Date | null;
  leads_found: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

function rowToWatchedGroup(row: WatchedGroupRow): IWatchedGroup & { id: string } {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    url: row.url,
    category: row.category,
    lastVisited: row.last_visited ?? undefined,
    leadsFound: row.leads_found,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const WatchedGroup = {
  async findById(id: string): Promise<(IWatchedGroup & { id: string }) | null> {
    const sql = getDb();
    const rows = await sql`SELECT * FROM watched_groups WHERE id = ${id}`;
    if (rows.length === 0) return null;
    return rowToWatchedGroup(rows[0] as WatchedGroupRow);
  },

  async findByUserId(
    userId: string,
    options?: { activeOnly?: boolean }
  ): Promise<(IWatchedGroup & { id: string })[]> {
    const sql = getDb();
    
    let rows;
    if (options?.activeOnly) {
      rows = await sql`
        SELECT * FROM watched_groups 
        WHERE user_id = ${userId} AND is_active = true
        ORDER BY last_visited DESC NULLS LAST
      `;
    } else {
      rows = await sql`
        SELECT * FROM watched_groups 
        WHERE user_id = ${userId}
        ORDER BY last_visited DESC NULLS LAST
      `;
    }

    return rows.map((row) => rowToWatchedGroup(row as WatchedGroupRow));
  },

  async findNextToVisit(userId: string): Promise<(IWatchedGroup & { id: string }) | null> {
    const sql = getDb();
    const rows = await sql`
      SELECT * FROM watched_groups 
      WHERE user_id = ${userId} AND is_active = true
      ORDER BY last_visited ASC NULLS FIRST
      LIMIT 1
    `;
    if (rows.length === 0) return null;
    return rowToWatchedGroup(rows[0] as WatchedGroupRow);
  },

  async findByUrl(userId: string, url: string): Promise<(IWatchedGroup & { id: string }) | null> {
    const sql = getDb();
    const rows = await sql`
      SELECT * FROM watched_groups 
      WHERE user_id = ${userId} AND url = ${url}
    `;
    if (rows.length === 0) return null;
    return rowToWatchedGroup(rows[0] as WatchedGroupRow);
  },

  async create(data: {
    userId: string;
    name: string;
    url: string;
    category?: string;
    isActive?: boolean;
  }): Promise<IWatchedGroup & { id: string }> {
    const sql = getDb();
    const rows = await sql`
      INSERT INTO watched_groups (user_id, name, url, category, is_active)
      VALUES (${data.userId}, ${data.name}, ${data.url}, ${data.category ?? 'general'}, ${data.isActive ?? true})
      RETURNING *
    `;
    return rowToWatchedGroup(rows[0] as WatchedGroupRow);
  },

  async update(id: string, data: Partial<{
    name: string;
    url: string;
    category: string;
    lastVisited: Date;
    leadsFound: number;
    isActive: boolean;
  }>): Promise<(IWatchedGroup & { id: string }) | null> {
    const sql = getDb();
    const rows = await sql`
      UPDATE watched_groups SET
        name = COALESCE(${data.name ?? null}, name),
        url = COALESCE(${data.url ?? null}, url),
        category = COALESCE(${data.category ?? null}, category),
        last_visited = COALESCE(${data.lastVisited ?? null}, last_visited),
        leads_found = COALESCE(${data.leadsFound ?? null}, leads_found),
        is_active = COALESCE(${data.isActive ?? null}, is_active)
      WHERE id = ${id}
      RETURNING *
    `;
    if (rows.length === 0) return null;
    return rowToWatchedGroup(rows[0] as WatchedGroupRow);
  },

  async incrementLeadsFound(id: string, count = 1): Promise<void> {
    const sql = getDb();
    await sql`
      UPDATE watched_groups SET 
        leads_found = leads_found + ${count},
        last_visited = NOW()
      WHERE id = ${id}
    `;
  },

  async markVisited(id: string): Promise<void> {
    const sql = getDb();
    await sql`UPDATE watched_groups SET last_visited = NOW() WHERE id = ${id}`;
  },

  async delete(id: string): Promise<boolean> {
    const sql = getDb();
    const result = await sql`DELETE FROM watched_groups WHERE id = ${id} RETURNING id`;
    return result.length > 0;
  },
};
