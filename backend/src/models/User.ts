import { getDb } from '../db/index.js';
import type { IUser, SubscriptionPlan, SubscriptionStatus } from '../types/index.js';
import { PLAN_LIMITS } from '../types/index.js';

export interface UserRow {
  id: string;
  google_id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  subscription_plan: SubscriptionPlan;
  subscription_status: SubscriptionStatus;
  lemon_squeezy_customer_id: string | null;
  lemon_squeezy_subscription_id: string | null;
  current_period_end: Date | null;
  cancel_at_period_end: boolean;
  leads_found_this_month: number;
  ai_calls_this_month: number;
  last_reset_date: Date;
  leads_per_month: number;
  ai_calls_per_month: number;
  created_at: Date;
  updated_at: Date;
}

function rowToUser(row: UserRow): IUser & { id: string } {
  return {
    id: row.id,
    googleId: row.google_id,
    email: row.email,
    name: row.name ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    subscription: {
      plan: row.subscription_plan,
      status: row.subscription_status,
      lemonSqueezyCustomerId: row.lemon_squeezy_customer_id ?? undefined,
      lemonSqueezySubscriptionId: row.lemon_squeezy_subscription_id ?? undefined,
      currentPeriodEnd: row.current_period_end ?? undefined,
      cancelAtPeriodEnd: row.cancel_at_period_end,
    },
    usage: {
      leadsFoundThisMonth: row.leads_found_this_month,
      aiCallsThisMonth: row.ai_calls_this_month,
      lastResetDate: row.last_reset_date,
    },
    limits: {
      leadsPerMonth: row.leads_per_month,
      aiCallsPerMonth: row.ai_calls_per_month,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const User = {
  async findById(id: string): Promise<(IUser & { id: string }) | null> {
    const sql = getDb();
    const rows = await sql`SELECT * FROM users WHERE id = ${id}`;
    if (rows.length === 0) return null;
    return rowToUser(rows[0] as UserRow);
  },

  async findByGoogleId(googleId: string): Promise<(IUser & { id: string }) | null> {
    const sql = getDb();
    const rows = await sql`SELECT * FROM users WHERE google_id = ${googleId}`;
    if (rows.length === 0) return null;
    return rowToUser(rows[0] as UserRow);
  },

  async findByEmail(email: string): Promise<(IUser & { id: string }) | null> {
    const sql = getDb();
    const rows = await sql`SELECT * FROM users WHERE email = ${email.toLowerCase()}`;
    if (rows.length === 0) return null;
    return rowToUser(rows[0] as UserRow);
  },

  async findByLemonSqueezyCustomerId(customerId: string): Promise<(IUser & { id: string }) | null> {
    const sql = getDb();
    const rows = await sql`SELECT * FROM users WHERE lemon_squeezy_customer_id = ${customerId}`;
    if (rows.length === 0) return null;
    return rowToUser(rows[0] as UserRow);
  },

  async findByLemonSqueezySubscriptionId(subscriptionId: string): Promise<(IUser & { id: string }) | null> {
    const sql = getDb();
    const rows = await sql`SELECT * FROM users WHERE lemon_squeezy_subscription_id = ${subscriptionId}`;
    if (rows.length === 0) return null;
    return rowToUser(rows[0] as UserRow);
  },

  async create(data: {
    googleId: string;
    email: string;
    name?: string;
    avatarUrl?: string;
  }): Promise<IUser & { id: string }> {
    const sql = getDb();
    const rows = await sql`
      INSERT INTO users (google_id, email, name, avatar_url)
      VALUES (${data.googleId}, ${data.email.toLowerCase()}, ${data.name ?? null}, ${data.avatarUrl ?? null})
      RETURNING *
    `;
    return rowToUser(rows[0] as UserRow);
  },

  async update(id: string, data: Partial<{
    name: string;
    avatarUrl: string;
    subscriptionPlan: SubscriptionPlan;
    subscriptionStatus: SubscriptionStatus;
    lemonSqueezyCustomerId: string;
    lemonSqueezySubscriptionId: string;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    leadsFoundThisMonth: number;
    aiCallsThisMonth: number;
    lastResetDate: Date;
    leadsPerMonth: number;
    aiCallsPerMonth: number;
  }>): Promise<(IUser & { id: string }) | null> {
    const sql = getDb();
    const rows = await sql`
      UPDATE users SET
        name = COALESCE(${data.name ?? null}, name),
        avatar_url = COALESCE(${data.avatarUrl ?? null}, avatar_url),
        subscription_plan = COALESCE(${data.subscriptionPlan ?? null}, subscription_plan),
        subscription_status = COALESCE(${data.subscriptionStatus ?? null}, subscription_status),
        lemon_squeezy_customer_id = COALESCE(${data.lemonSqueezyCustomerId ?? null}, lemon_squeezy_customer_id),
        lemon_squeezy_subscription_id = COALESCE(${data.lemonSqueezySubscriptionId ?? null}, lemon_squeezy_subscription_id),
        current_period_end = COALESCE(${data.currentPeriodEnd ?? null}, current_period_end),
        cancel_at_period_end = COALESCE(${data.cancelAtPeriodEnd ?? null}, cancel_at_period_end),
        leads_found_this_month = COALESCE(${data.leadsFoundThisMonth ?? null}, leads_found_this_month),
        ai_calls_this_month = COALESCE(${data.aiCallsThisMonth ?? null}, ai_calls_this_month),
        last_reset_date = COALESCE(${data.lastResetDate ?? null}, last_reset_date),
        leads_per_month = COALESCE(${data.leadsPerMonth ?? null}, leads_per_month),
        ai_calls_per_month = COALESCE(${data.aiCallsPerMonth ?? null}, ai_calls_per_month)
      WHERE id = ${id}
      RETURNING *
    `;
    if (rows.length === 0) return null;
    return rowToUser(rows[0] as UserRow);
  },

  async incrementUsage(id: string, type: 'leads' | 'aiCalls', amount = 1): Promise<void> {
    const sql = getDb();
    if (type === 'leads') {
      await sql`UPDATE users SET leads_found_this_month = leads_found_this_month + ${amount} WHERE id = ${id}`;
    } else {
      await sql`UPDATE users SET ai_calls_this_month = ai_calls_this_month + ${amount} WHERE id = ${id}`;
    }
  },

  async resetMonthlyUsage(id: string): Promise<void> {
    const sql = getDb();
    await sql`
      UPDATE users SET 
        leads_found_this_month = 0,
        ai_calls_this_month = 0,
        last_reset_date = NOW()
      WHERE id = ${id}
    `;
  },

  async updatePlan(id: string, plan: SubscriptionPlan): Promise<void> {
    const sql = getDb();
    const limits = PLAN_LIMITS[plan];
    await sql`
      UPDATE users SET 
        subscription_plan = ${plan},
        leads_per_month = ${limits.leadsPerMonth === Infinity ? 999999 : limits.leadsPerMonth},
        ai_calls_per_month = ${limits.aiCallsPerMonth}
      WHERE id = ${id}
    `;
  },

  isWithinLimits(user: IUser & { id: string }, type: 'leads' | 'aiCalls'): boolean {
    if (type === 'leads') {
      return user.usage.leadsFoundThisMonth < user.limits.leadsPerMonth;
    }
    return user.usage.aiCallsThisMonth < user.limits.aiCallsPerMonth;
  },

  async delete(id: string): Promise<boolean> {
    const sql = getDb();
    const result = await sql`DELETE FROM users WHERE id = ${id} RETURNING id`;
    return result.length > 0;
  },
};
