import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { storage } from 'wxt/storage';
import type { Lead, Persona, UserSubscription } from '../types';

export const authSessionStorage = storage.defineItem<Session | null>(
  'local:authSession',
  { fallback: null }
);

export const userSubscriptionStorage = storage.defineItem<UserSubscription | null>(
  'local:userSubscription',
  { fallback: null }
);

export interface Database {
  public: {
    Tables: {
      leads: {
        Row: Lead & { user_id: string };
        Insert: Omit<Lead, 'id'> & { user_id: string };
        Update: Partial<Lead>;
      };
      personas: {
        Row: Persona & { user_id: string };
        Insert: Omit<Persona, 'id'> & { user_id: string };
        Update: Partial<Persona>;
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: 'free' | 'pro' | 'agency';
          leads_limit: number;
          ai_calls_limit: number;
          valid_until: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['subscriptions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['subscriptions']['Row']>;
      };
    };
  };
}

class SupabaseAuth {
  private client: SupabaseClient<Database> | null = null;
  private initialized = false;

  async init(supabaseUrl?: string, supabaseKey?: string): Promise<boolean> {
    if (this.initialized && this.client) return true;

    const url = supabaseUrl || import.meta.env.VITE_SUPABASE_URL;
    const key = supabaseKey || import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!url || !key) {
      console.warn('[Supabase] Missing URL or Anon Key. Cloud sync disabled.');
      return false;
    }

    try {
      this.client = createClient<Database>(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      });

      const savedSession = await authSessionStorage.getValue();
      if (savedSession) {
        await this.client.auth.setSession(savedSession);
      }

      this.client.auth.onAuthStateChange(async (event, session) => {
        console.log('[Supabase] Auth state changed:', event);
        await authSessionStorage.setValue(session);
        
        if (session?.user) {
          await this.loadUserSubscription(session.user.id);
        } else {
          await userSubscriptionStorage.setValue(null);
        }
      });

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('[Supabase] Initialization failed:', error);
      return false;
    }
  }

  getClient(): SupabaseClient<Database> | null {
    return this.client;
  }

  async signInWithEmail(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
    if (!this.client) {
      return { user: null, error: new Error('Supabase not initialized') };
    }

    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, error };
      }

      return { user: data.user, error: null };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  async signUpWithEmail(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
    if (!this.client) {
      return { user: null, error: new Error('Supabase not initialized') };
    }

    try {
      const { data, error } = await this.client.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { user: null, error };
      }

      if (data.user) {
        await this.createDefaultSubscription(data.user.id);
      }

      return { user: data.user, error: null };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  async signInWithGoogle(): Promise<{ error: Error | null }> {
    if (!this.client) {
      return { error: new Error('Supabase not initialized') };
    }

    try {
      const redirectUrl = chrome.identity.getRedirectURL();
      
      const { data, error } = await this.client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        return { error };
      }

      if (data.url) {
        return new Promise((resolve) => {
          chrome.identity.launchWebAuthFlow(
            {
              url: data.url,
              interactive: true,
            },
            async (responseUrl) => {
              if (chrome.runtime.lastError || !responseUrl) {
                resolve({ error: new Error(chrome.runtime.lastError?.message || 'Auth cancelled') });
                return;
              }

              const url = new URL(responseUrl);
              const hashParams = new URLSearchParams(url.hash.substring(1));
              const accessToken = hashParams.get('access_token');
              const refreshToken = hashParams.get('refresh_token');

              if (accessToken && refreshToken) {
                await this.client!.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken,
                });
                resolve({ error: null });
              } else {
                resolve({ error: new Error('Failed to get auth tokens') });
              }
            }
          );
        });
      }

      return { error: new Error('No auth URL generated') };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async signOut(): Promise<void> {
    if (this.client) {
      await this.client.auth.signOut();
    }
    await authSessionStorage.setValue(null);
    await userSubscriptionStorage.setValue(null);
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.client) return null;
    
    const { data } = await this.client.auth.getUser();
    return data.user;
  }

  async getSession(): Promise<Session | null> {
    if (!this.client) return null;
    
    const { data } = await this.client.auth.getSession();
    return data.session;
  }

  private async createDefaultSubscription(userId: string): Promise<void> {
    if (!this.client) return;

    try {
      await this.client.from('subscriptions').insert({
        user_id: userId,
        plan: 'free',
        leads_limit: 5,
        ai_calls_limit: 20,
        valid_until: null,
      });
    } catch (error) {
      console.error('[Supabase] Failed to create default subscription:', error);
    }
  }

  private async loadUserSubscription(userId: string): Promise<void> {
    if (!this.client) return;

    try {
      const { data, error } = await this.client
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        await this.createDefaultSubscription(userId);
        await userSubscriptionStorage.setValue({
          plan: 'free',
          leadsLimit: 5,
          aiCallsLimit: 20,
        });
        return;
      }

      await userSubscriptionStorage.setValue({
        plan: data.plan,
        leadsLimit: data.leads_limit,
        aiCallsLimit: data.ai_calls_limit,
      });
    } catch (error) {
      console.error('[Supabase] Failed to load subscription:', error);
    }
  }

  async syncLeadsToCloud(leads: Lead[]): Promise<void> {
    if (!this.client) return;
    
    const user = await this.getCurrentUser();
    if (!user) return;

    try {
      const leadsWithUserId = leads.map(lead => ({
        ...lead,
        user_id: user.id,
      }));

      await this.client
        .from('leads')
        .upsert(leadsWithUserId, { onConflict: 'id' });
    } catch (error) {
      console.error('[Supabase] Failed to sync leads:', error);
    }
  }

  async fetchLeadsFromCloud(): Promise<Lead[]> {
    if (!this.client) return [];
    
    const user = await this.getCurrentUser();
    if (!user) return [];

    try {
      const { data, error } = await this.client
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .order('createdAt', { ascending: false });

      if (error || !data) return [];

      return data.map(({ user_id: _uid, ...lead }) => lead as Lead);
    } catch (error) {
      console.error('[Supabase] Failed to fetch leads:', error);
      return [];
    }
  }

  async syncPersonasToCloud(personas: Persona[]): Promise<void> {
    if (!this.client) return;
    
    const user = await this.getCurrentUser();
    if (!user) return;

    try {
      const personasWithUserId = personas.map(persona => ({
        ...persona,
        user_id: user.id,
      }));

      await this.client
        .from('personas')
        .upsert(personasWithUserId, { onConflict: 'id' });
    } catch (error) {
      console.error('[Supabase] Failed to sync personas:', error);
    }
  }

  async fetchPersonasFromCloud(): Promise<Persona[]> {
    if (!this.client) return [];
    
    const user = await this.getCurrentUser();
    if (!user) return [];

    try {
      const { data, error } = await this.client
        .from('personas')
        .select('*')
        .eq('user_id', user.id)
        .order('createdAt', { ascending: false });

      if (error || !data) return [];

      return data.map(({ user_id: _uid, ...persona }) => persona as Persona);
    } catch (error) {
      console.error('[Supabase] Failed to fetch personas:', error);
      return [];
    }
  }
}

export const supabaseAuth = new SupabaseAuth();

export type { User, Session };
