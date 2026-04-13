-- =============================================
-- ROOTINE — Supabase Database Schema
-- Run this in your Supabase SQL Editor:
-- https://app.supabase.com → SQL Editor
-- =============================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLE: habits
-- =============================================
CREATE TABLE habits (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  emoji       TEXT DEFAULT '🌱',
  description TEXT,
  category    TEXT DEFAULT 'mind' CHECK (category IN ('mind', 'body', 'nutrition', 'work', 'social', 'creative')),
  frequency   TEXT DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekdays', 'weekends', 'weekly')),
  color       TEXT DEFAULT '#5a7a3a',
  is_archived BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLE: completions
-- =============================================
CREATE TABLE completions (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  habit_id        UUID REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
  completed_date  DATE NOT NULL,
  note            TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate completions for same habit on same day
  UNIQUE (user_id, habit_id, completed_date)
);

-- =============================================
-- TABLE: profiles (extends auth.users)
-- =============================================
CREATE TABLE profiles (
  id            UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name     TEXT,
  avatar_emoji  TEXT DEFAULT '🌿',
  timezone      TEXT DEFAULT 'UTC',
  reminder_time TIME DEFAULT '20:00',
  notifications JSONB DEFAULT '{"daily": true, "streak": true, "weekly": false}',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- Ensures users can only access their own data
-- =============================================

-- Enable RLS on all tables
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Habits policies
CREATE POLICY "Users can view their own habits"
  ON habits FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own habits"
  ON habits FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habits"
  ON habits FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habits"
  ON habits FOR DELETE USING (auth.uid() = user_id);

-- Completions policies
CREATE POLICY "Users can view their own completions"
  ON completions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own completions"
  ON completions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own completions"
  ON completions FOR DELETE USING (auth.uid() = user_id);

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER habits_updated_at
  BEFORE UPDATE ON habits
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

-- =============================================
-- USEFUL VIEWS (optional)
-- =============================================

-- View: habits with today's completion status
CREATE VIEW habits_today AS
SELECT
  h.*,
  CASE
    WHEN c.id IS NOT NULL THEN TRUE
    ELSE FALSE
  END AS completed_today
FROM habits h
LEFT JOIN completions c ON (
  c.habit_id = h.id
  AND c.user_id = h.user_id
  AND c.completed_date = CURRENT_DATE
)
WHERE h.is_archived = FALSE;

-- =============================================
-- SAMPLE INDEXES for performance
-- =============================================
CREATE INDEX idx_habits_user_id ON habits(user_id);
CREATE INDEX idx_completions_user_id ON completions(user_id);
CREATE INDEX idx_completions_habit_id ON completions(habit_id);
CREATE INDEX idx_completions_date ON completions(completed_date);
CREATE INDEX idx_completions_user_date ON completions(user_id, completed_date);
