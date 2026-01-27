import type { Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import type { AuthenticatedRequest } from '../types/index.js';

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (!supabase && env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
    supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
  }
  return supabase;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Missing authorization header' });
  }

  const token = authHeader.slice(7);

  try {
    const supabaseAdmin = getSupabaseAdmin();

    if (!supabaseAdmin) {
      return res.status(500).json({ success: false, error: 'Auth service unavailable' });
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }

    let dbUser = await User.findBySupabaseId(user.id);

    if (!dbUser) {
      dbUser = await User.create({
        supabaseId: user.id,
        email: user.email!,
        name: user.user_metadata?.full_name || user.user_metadata?.name,
        avatarUrl: user.user_metadata?.avatar_url,
      });
    }

    req.user = {
      supabaseId: user.id,
      email: user.email!,
      dbUserId: dbUser._id.toString(),
    };

    next();
  } catch (error) {
    console.error('[Auth] Token validation error:', error);
    return res.status(401).json({ success: false, error: 'Authentication failed' });
  }
}

export async function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.slice(7);

  try {
    const supabaseAdmin = getSupabaseAdmin();

    if (!supabaseAdmin) {
      return next();
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (!error && user) {
      const dbUser = await User.findBySupabaseId(user.id);

      if (dbUser) {
        req.user = {
          supabaseId: user.id,
          email: user.email!,
          dbUserId: dbUser._id.toString(),
        };
      }
    }

    next();
  } catch {
    next();
  }
}
