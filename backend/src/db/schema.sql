-- LeadScout AI PostgreSQL Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  avatar_url TEXT,
  
  -- Subscription (embedded as columns for simplicity)
  subscription_plan VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (subscription_plan IN ('free', 'pro', 'agency')),
  subscription_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired', 'past_due', 'paused')),
  lemon_squeezy_customer_id VARCHAR(255),
  lemon_squeezy_subscription_id VARCHAR(255),
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  
  -- Usage
  leads_found_this_month INTEGER NOT NULL DEFAULT 0,
  ai_calls_this_month INTEGER NOT NULL DEFAULT 0,
  last_reset_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Limits
  leads_per_month INTEGER NOT NULL DEFAULT 10,
  ai_calls_per_month INTEGER NOT NULL DEFAULT 25,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_lemon_squeezy_customer_id ON users(lemon_squeezy_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_lemon_squeezy_subscription_id ON users(lemon_squeezy_subscription_id);

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_url TEXT NOT NULL,
  post_text TEXT NOT NULL,
  author_name VARCHAR(255) NOT NULL,
  author_profile_url TEXT NOT NULL,
  group_name VARCHAR(255),
  intent VARCHAR(50) NOT NULL CHECK (intent IN ('seeking_service', 'hiring', 'complaining', 'recommendation', 'discussion', 'selling', 'irrelevant')),
  lead_score INTEGER NOT NULL CHECK (lead_score >= 0 AND lead_score <= 100),
  
  -- AI Analysis (JSONB for flexibility)
  ai_analysis JSONB,
  ai_draft_reply TEXT,
  
  status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'ignored')),
  
  -- Response tracking (JSONB for flexibility)
  response_tracking JSONB DEFAULT '{"responded": false}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_user_id_created_at ON leads(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_user_id_status ON leads(user_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_user_id_intent ON leads(user_id, intent);

-- Personas table
CREATE TABLE IF NOT EXISTS personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  negative_keywords TEXT[] NOT NULL DEFAULT '{}',
  ai_tone VARCHAR(20) NOT NULL DEFAULT 'professional' CHECK (ai_tone IN ('professional', 'casual', 'friendly', 'expert')),
  value_proposition TEXT NOT NULL,
  signature TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_personas_user_id ON personas(user_id);
CREATE INDEX IF NOT EXISTS idx_personas_user_id_is_active ON personas(user_id, is_active);

-- Watched Groups table
CREATE TABLE IF NOT EXISTS watched_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'general',
  last_visited TIMESTAMPTZ,
  leads_found INTEGER NOT NULL DEFAULT 0 CHECK (leads_found >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, url)
);

CREATE INDEX IF NOT EXISTS idx_watched_groups_user_id ON watched_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_watched_groups_user_id_is_active ON watched_groups(user_id, is_active);

-- Automation Settings table
CREATE TABLE IF NOT EXISTS automation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  scan_interval_minutes INTEGER NOT NULL DEFAULT 30 CHECK (scan_interval_minutes >= 5 AND scan_interval_minutes <= 1440),
  groups_per_cycle INTEGER NOT NULL DEFAULT 3 CHECK (groups_per_cycle >= 1 AND groups_per_cycle <= 20),
  delay_min_seconds INTEGER NOT NULL DEFAULT 5 CHECK (delay_min_seconds >= 1),
  delay_max_seconds INTEGER NOT NULL DEFAULT 15 CHECK (delay_max_seconds >= 5),
  last_scan_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_settings_user_id ON automation_settings(user_id);

-- Trigger function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to all tables
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_personas_updated_at ON personas;
CREATE TRIGGER update_personas_updated_at BEFORE UPDATE ON personas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_watched_groups_updated_at ON watched_groups;
CREATE TRIGGER update_watched_groups_updated_at BEFORE UPDATE ON watched_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_automation_settings_updated_at ON automation_settings;
CREATE TRIGGER update_automation_settings_updated_at BEFORE UPDATE ON automation_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
