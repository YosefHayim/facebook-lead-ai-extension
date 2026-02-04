import { getDb } from '../db/index.js';
import type { ILead, IntentType, LeadStatus } from '../types/index.js';

export interface LeadRow {
  id: string;
  user_id: string;
  post_url: string;
  post_text: string;
  author_name: string;
  author_profile_url: string;
  group_name: string | null;
  intent: IntentType;
  lead_score: number;
  ai_analysis: {
    intent: IntentType;
    confidence: number;
    reasoning: string;
    keywords: string[];
  } | null;
  ai_draft_reply: string | null;
  status: LeadStatus;
  response_tracking: {
    responded: boolean;
    responseText?: string;
    respondedAt?: string;
    gotReply?: boolean;
    repliedAt?: string;
  } | null;
  created_at: Date;
  updated_at: Date;
}

function rowToLead(row: LeadRow): ILead & { id: string } {
  return {
    id: row.id,
    userId: row.user_id,
    postUrl: row.post_url,
    postText: row.post_text,
    authorName: row.author_name,
    authorProfileUrl: row.author_profile_url,
    groupName: row.group_name ?? undefined,
    intent: row.intent,
    leadScore: row.lead_score,
    aiAnalysis: row.ai_analysis ?? undefined,
    aiDraftReply: row.ai_draft_reply ?? undefined,
    status: row.status,
    responseTracking: row.response_tracking ? {
      responded: row.response_tracking.responded,
      responseText: row.response_tracking.responseText,
      respondedAt: row.response_tracking.respondedAt ? new Date(row.response_tracking.respondedAt) : undefined,
      gotReply: row.response_tracking.gotReply,
      repliedAt: row.response_tracking.repliedAt ? new Date(row.response_tracking.repliedAt) : undefined,
    } : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const Lead = {
  async createWithUsage(data: {
    userId: string;
    postUrl: string;
    postText: string;
    authorName: string;
    authorProfileUrl: string;
    groupName?: string;
    intent: IntentType;
    leadScore: number;
    aiAnalysis?: {
      intent: IntentType;
      confidence: number;
      reasoning: string;
      keywords: string[];
    };
    aiDraftReply?: string;
  }): Promise<(ILead & { id: string }) | null> {
    const sql = getDb();
    const rows = await sql`
      WITH inserted AS (
        INSERT INTO leads (
          user_id, post_url, post_text, author_name, author_profile_url,
          group_name, intent, lead_score, ai_analysis, ai_draft_reply
        )
        VALUES (
          ${data.userId}, ${data.postUrl}, ${data.postText}, ${data.authorName}, ${data.authorProfileUrl},
          ${data.groupName ?? null}, ${data.intent}, ${data.leadScore},
          ${data.aiAnalysis ? JSON.stringify(data.aiAnalysis) : null}::jsonb,
          ${data.aiDraftReply ?? null}
        )
        ON CONFLICT (user_id, post_url) DO NOTHING
        RETURNING *
      ),
      usage_update AS (
        UPDATE users
        SET leads_found_this_month = leads_found_this_month + (SELECT COUNT(*) FROM inserted)
        WHERE id = ${data.userId}
        RETURNING id
      )
      SELECT * FROM inserted
    `;
    if (rows.length === 0) return null;
    return rowToLead(rows[0] as LeadRow);
  },
  async findById(id: string): Promise<(ILead & { id: string }) | null> {
    const sql = getDb();
    const rows = await sql`SELECT * FROM leads WHERE id = ${id}`;
    if (rows.length === 0) return null;
    return rowToLead(rows[0] as LeadRow);
  },

  async findByUserId(
    userId: string,
    options?: { status?: LeadStatus; limit?: number; skip?: number }
  ): Promise<(ILead & { id: string })[]> {
    const sql = getDb();
    const limit = options?.limit ?? 100;
    const offset = options?.skip ?? 0;

    let rows;
    if (options?.status) {
      rows = await sql`
        SELECT * FROM leads 
        WHERE user_id = ${userId} AND status = ${options.status}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      rows = await sql`
        SELECT * FROM leads 
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    return rows.map((row) => rowToLead(row as LeadRow));
  },

  async countByUserId(
    userId: string,
    options?: { status?: LeadStatus; since?: Date }
  ): Promise<number> {
    const sql = getDb();
    
    let result;
    if (options?.status && options?.since) {
      result = await sql`
        SELECT COUNT(*)::int as count FROM leads 
        WHERE user_id = ${userId} AND status = ${options.status} AND created_at >= ${options.since}
      `;
    } else if (options?.status) {
      result = await sql`
        SELECT COUNT(*)::int as count FROM leads 
        WHERE user_id = ${userId} AND status = ${options.status}
      `;
    } else if (options?.since) {
      result = await sql`
        SELECT COUNT(*)::int as count FROM leads 
        WHERE user_id = ${userId} AND created_at >= ${options.since}
      `;
    } else {
      result = await sql`
        SELECT COUNT(*)::int as count FROM leads 
        WHERE user_id = ${userId}
      `;
    }

    return (result[0] as { count: number }).count;
  },

  async create(data: {
    userId: string;
    postUrl: string;
    postText: string;
    authorName: string;
    authorProfileUrl: string;
    groupName?: string;
    intent: IntentType;
    leadScore: number;
    aiAnalysis?: {
      intent: IntentType;
      confidence: number;
      reasoning: string;
      keywords: string[];
    };
    aiDraftReply?: string;
  }): Promise<ILead & { id: string }> {
    const sql = getDb();
    const rows = await sql`
      INSERT INTO leads (
        user_id, post_url, post_text, author_name, author_profile_url,
        group_name, intent, lead_score, ai_analysis, ai_draft_reply
      )
      VALUES (
        ${data.userId}, ${data.postUrl}, ${data.postText}, ${data.authorName}, ${data.authorProfileUrl},
        ${data.groupName ?? null}, ${data.intent}, ${data.leadScore}, 
        ${data.aiAnalysis ? JSON.stringify(data.aiAnalysis) : null}::jsonb,
        ${data.aiDraftReply ?? null}
      )
      RETURNING *
    `;
    return rowToLead(rows[0] as LeadRow);
  },

  async createBulk(leads: Array<{
    userId: string;
    postUrl: string;
    postText: string;
    authorName: string;
    authorProfileUrl: string;
    groupName?: string;
    intent: IntentType;
    leadScore: number;
    aiAnalysis?: {
      intent: IntentType;
      confidence: number;
      reasoning: string;
      keywords: string[];
    };
    aiDraftReply?: string;
  }>): Promise<(ILead & { id: string })[]> {
    if (leads.length === 0) return [];

    const sql = getDb();
    const userIds = leads.map((lead) => lead.userId);
    const postUrls = leads.map((lead) => lead.postUrl);
    const postTexts = leads.map((lead) => lead.postText);
    const authorNames = leads.map((lead) => lead.authorName);
    const authorProfileUrls = leads.map((lead) => lead.authorProfileUrl);
    const groupNames = leads.map((lead) => lead.groupName ?? null);
    const intents = leads.map((lead) => lead.intent);
    const leadScores = leads.map((lead) => lead.leadScore);
    const aiAnalyses = leads.map((lead) =>
      lead.aiAnalysis ? JSON.stringify(lead.aiAnalysis) : null
    );
    const aiDraftReplies = leads.map((lead) => lead.aiDraftReply ?? null);

    const rows = await sql`
      INSERT INTO leads (
        user_id, post_url, post_text, author_name, author_profile_url,
        group_name, intent, lead_score, ai_analysis, ai_draft_reply
      )
      SELECT * FROM UNNEST(
        ${userIds}::uuid[],
        ${postUrls}::text[],
        ${postTexts}::text[],
        ${authorNames}::text[],
        ${authorProfileUrls}::text[],
        ${groupNames}::text[],
        ${intents}::text[],
        ${leadScores}::int[],
        ${aiAnalyses}::jsonb[],
        ${aiDraftReplies}::text[]
      )
      ON CONFLICT (user_id, post_url) DO NOTHING
      RETURNING *
    `;

    return rows.map((row) => rowToLead(row as LeadRow));
  },

  async createBulkWithUsage(params: {
    userId: string;
    leads: Array<{
      postUrl: string;
      postText: string;
      authorName: string;
      authorProfileUrl: string;
      groupName?: string;
      intent: IntentType;
      leadScore: number;
      aiAnalysis?: {
        intent: IntentType;
        confidence: number;
        reasoning: string;
        keywords: string[];
      };
      aiDraftReply?: string;
    }>;
  }): Promise<{ leads: (ILead & { id: string })[]; created: number; skipped: number }> {
    if (params.leads.length === 0) return { leads: [], created: 0, skipped: 0 };

    const sql = getDb();
    const userIds = params.leads.map(() => params.userId);
    const postUrls = params.leads.map((lead) => lead.postUrl);
    const postTexts = params.leads.map((lead) => lead.postText);
    const authorNames = params.leads.map((lead) => lead.authorName);
    const authorProfileUrls = params.leads.map((lead) => lead.authorProfileUrl);
    const groupNames = params.leads.map((lead) => lead.groupName ?? null);
    const intents = params.leads.map((lead) => lead.intent);
    const leadScores = params.leads.map((lead) => lead.leadScore);
    const aiAnalyses = params.leads.map((lead) =>
      lead.aiAnalysis ? JSON.stringify(lead.aiAnalysis) : null
    );
    const aiDraftReplies = params.leads.map((lead) => lead.aiDraftReply ?? null);

    const rows = await sql`
      WITH inserted AS (
        INSERT INTO leads (
          user_id, post_url, post_text, author_name, author_profile_url,
          group_name, intent, lead_score, ai_analysis, ai_draft_reply
        )
        SELECT * FROM UNNEST(
          ${userIds}::uuid[],
          ${postUrls}::text[],
          ${postTexts}::text[],
          ${authorNames}::text[],
          ${authorProfileUrls}::text[],
          ${groupNames}::text[],
          ${intents}::text[],
          ${leadScores}::int[],
          ${aiAnalyses}::jsonb[],
          ${aiDraftReplies}::text[]
        )
        ON CONFLICT (user_id, post_url) DO NOTHING
        RETURNING *
      ),
      usage_update AS (
        UPDATE users
        SET leads_found_this_month = leads_found_this_month + (SELECT COUNT(*) FROM inserted)
        WHERE id = ${params.userId}
        RETURNING id
      )
      SELECT * FROM inserted
    `;

    const created = rows.length;
    return {
      leads: rows.map((row) => rowToLead(row as LeadRow)),
      created,
      skipped: params.leads.length - created,
    };
  },

  async update(id: string, data: Partial<{
    status: LeadStatus;
    aiDraftReply: string;
    responseTracking: {
      responded: boolean;
      responseText?: string;
      respondedAt?: Date;
      gotReply?: boolean;
      repliedAt?: Date;
    };
  }>): Promise<(ILead & { id: string }) | null> {
    const sql = getDb();
    
    const responseTrackingJson = data.responseTracking ? JSON.stringify({
      responded: data.responseTracking.responded,
      responseText: data.responseTracking.responseText,
      respondedAt: data.responseTracking.respondedAt?.toISOString(),
      gotReply: data.responseTracking.gotReply,
      repliedAt: data.responseTracking.repliedAt?.toISOString(),
    }) : null;

    const rows = await sql`
      UPDATE leads SET
        status = COALESCE(${data.status ?? null}, status),
        ai_draft_reply = COALESCE(${data.aiDraftReply ?? null}, ai_draft_reply),
        response_tracking = COALESCE(${responseTrackingJson}::jsonb, response_tracking)
      WHERE id = ${id}
      RETURNING *
    `;
    if (rows.length === 0) return null;
    return rowToLead(rows[0] as LeadRow);
  },

  async delete(id: string): Promise<boolean> {
    const sql = getDb();
    const result = await sql`DELETE FROM leads WHERE id = ${id} RETURNING id`;
    return result.length > 0;
  },

  async deleteBulk(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    const sql = getDb();
    const result = await sql`DELETE FROM leads WHERE id = ANY(${ids}::uuid[]) RETURNING id`;
    return result.length;
  },

  async getStats(userId: string): Promise<{
    total: number;
    byStatus: Record<LeadStatus, number>;
    byIntent: Record<IntentType, number>;
    thisMonth: number;
  }> {
    const sql = getDb();
    
    const [totalResult, statusResult, intentResult, monthResult] = await Promise.all([
      sql`SELECT COUNT(*)::int as count FROM leads WHERE user_id = ${userId}`,
      sql`SELECT status, COUNT(*)::int as count FROM leads WHERE user_id = ${userId} GROUP BY status`,
      sql`SELECT intent, COUNT(*)::int as count FROM leads WHERE user_id = ${userId} GROUP BY intent`,
      sql`SELECT COUNT(*)::int as count FROM leads WHERE user_id = ${userId} AND created_at >= date_trunc('month', NOW())`,
    ]);

    const byStatus: Record<LeadStatus, number> = {
      new: 0,
      contacted: 0,
      converted: 0,
      ignored: 0,
    };
    statusResult.forEach((row) => {
      const r = row as { status: LeadStatus; count: number };
      byStatus[r.status] = r.count;
    });

    const byIntent: Record<IntentType, number> = {
      seeking_service: 0,
      hiring: 0,
      complaining: 0,
      recommendation: 0,
      discussion: 0,
      selling: 0,
      irrelevant: 0,
    };
    intentResult.forEach((row) => {
      const r = row as { intent: IntentType; count: number };
      byIntent[r.intent] = r.count;
    });

    return {
      total: (totalResult[0] as { count: number }).count,
      byStatus,
      byIntent,
      thisMonth: (monthResult[0] as { count: number }).count,
    };
  },
};
