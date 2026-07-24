-- ═══════════════════════════════════════════════════════════
-- Migration 015: Categories, Language, Topics, Reviews,
--                Badges/Gamification, Instructor role,
--                Shopping Cart, Subscriptions, Teams, 2FA
-- ═══════════════════════════════════════════════════════════

-- ─── 1. Categories ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL UNIQUE,
  name_ar     VARCHAR(100),
  slug        VARCHAR(100) NOT NULL UNIQUE,
  icon        VARCHAR(50),
  parent_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
  order_index SMALLINT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Add category + language to courses
DO $$ BEGIN
  ALTER TABLE courses ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
  ALTER TABLE courses ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'ar';
  ALTER TABLE courses ADD COLUMN IF NOT EXISTS short_description VARCHAR(300);
  CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category_id);
  CREATE INDEX IF NOT EXISTS idx_courses_language ON courses(language);
EXCEPTION WHEN others THEN NULL;
END $$;

-- Seed default categories
INSERT INTO categories (name, name_ar, slug, icon, order_index) VALUES
  ('Programming', 'برمجة', 'programming', '💻', 1),
  ('Design', 'تصميم', 'design', '🎨', 2),
  ('Marketing', 'تسويق', 'marketing', '📈', 3),
  ('Business', 'أعمال', 'business', '💼', 4),
  ('Data Science', 'علم البيانات', 'data-science', '📊', 5),
  ('Personal Development', 'تطوير ذاتي', 'personal-development', '🧠', 6),
  ('Languages', 'لغات', 'languages', '🌍', 7),
  ('Other', 'أخرى', 'other', '📚', 99)
ON CONFLICT (slug) DO NOTHING;

-- ─── 2. Topics (sub-lessons) ─────────────────────────────
CREATE TABLE IF NOT EXISTS lesson_topics (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id   UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  content     TEXT,
  order_index SMALLINT DEFAULT 0,
  duration_minutes SMALLINT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_topics_lesson ON lesson_topics(lesson_id);

-- ─── 3. Course Reviews & Ratings ─────────────────────────
CREATE TABLE IF NOT EXISTS course_reviews (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id  UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating     SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_reviews_course ON course_reviews(course_id);

-- Add avg_rating cache column to courses
DO $$ BEGIN
  ALTER TABLE courses ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(3,2) DEFAULT 0;
  ALTER TABLE courses ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;
EXCEPTION WHEN others THEN NULL;
END $$;

-- ─── 4. Instructor role ──────────────────────────────────
-- Extend the user_role enum to include 'instructor'
DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'instructor';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Instructor profile details
CREATE TABLE IF NOT EXISTS instructor_profiles (
  user_id     UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bio         TEXT,
  title       VARCHAR(200),
  specialties TEXT[],
  website     TEXT,
  social_links JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 5. Badges & Gamification ────────────────────────────
CREATE TABLE IF NOT EXISTS badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,
  name_ar     VARCHAR(100),
  description TEXT,
  icon        VARCHAR(100) NOT NULL DEFAULT '🏅',
  condition_type VARCHAR(50) NOT NULL, -- 'courses_completed','quizzes_passed','streak_days','first_enrollment','perfect_quiz'
  condition_value INTEGER DEFAULT 1,
  xp_reward   INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_badges (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id  UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);

-- XP / level tracking on users
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS level SMALLINT DEFAULT 1;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS last_activity_date DATE;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Seed default badges
INSERT INTO badges (name, name_ar, icon, condition_type, condition_value, xp_reward) VALUES
  ('First Step',     'الخطوة الأولى',  '🎯', 'first_enrollment',    1, 10),
  ('Fast Learner',   'متعلم سريع',     '⚡', 'courses_completed',   1, 50),
  ('Knowledge Seeker','طالب علم',       '📚', 'courses_completed',   5, 200),
  ('Quiz Master',    'خبير الاختبارات', '🧠', 'quizzes_passed',     10, 150),
  ('Perfect Score',  'علامة كاملة',    '💯', 'perfect_quiz',        1, 100),
  ('Streak 7',       'مثابر ٧ أيام',   '🔥', 'streak_days',         7, 75),
  ('Streak 30',      'أسطورة ٣٠ يوم',  '🏆', 'streak_days',        30, 300),
  ('Scholar',        'عالم',           '🎓', 'courses_completed',  10, 500)
ON CONFLICT DO NOTHING;

-- ─── 6. Shopping Cart ────────────────────────────────────
CREATE TABLE IF NOT EXISTS cart_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id  UUID REFERENCES courses(id) ON DELETE CASCADE,
  bundle_id  UUID REFERENCES bundles(id) ON DELETE CASCADE,
  added_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id),
  CHECK (course_id IS NOT NULL OR bundle_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);

-- ─── 7. Subscription Plans ──────────────────────────────
CREATE TABLE IF NOT EXISTS subscription_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(100) NOT NULL,
  name_ar         VARCHAR(100),
  description     TEXT,
  price_monthly   NUMERIC(10,2) NOT NULL,
  price_yearly    NUMERIC(10,2),
  features        JSONB DEFAULT '[]',
  max_courses     INTEGER,  -- NULL = unlimited
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id         UUID NOT NULL REFERENCES subscription_plans(id),
  status          VARCHAR(20) DEFAULT 'active', -- active, cancelled, expired, past_due
  billing_cycle   VARCHAR(10) DEFAULT 'monthly', -- monthly, yearly
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end   TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  payment_method  VARCHAR(50),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_subs_user ON user_subscriptions(user_id);

-- Seed a default plan
INSERT INTO subscription_plans (name, name_ar, description, price_monthly, price_yearly, features) VALUES
  ('Pro', 'اشتراك برو', 'وصول كامل لجميع الكورسات المسجلة', 299, 2499, '["كل الكورسات المسجلة","شهادات إتمام","أولوية الدعم"]')
ON CONFLICT DO NOTHING;

-- ─── 8. Teams / Corporate ────────────────────────────────
CREATE TABLE IF NOT EXISTS teams (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(200) NOT NULL,
  owner_id    UUID NOT NULL REFERENCES users(id),
  logo_url    TEXT,
  max_members INTEGER DEFAULT 50,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_members (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id   UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role      VARCHAR(20) DEFAULT 'member', -- owner, leader, member
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);

CREATE TABLE IF NOT EXISTS team_course_assignments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id    UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  course_id  UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  deadline   TIMESTAMPTZ,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, course_id)
);

-- ─── 9. Two-Factor Authentication ───────────────────────
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret TEXT;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_backup_codes TEXT[];
EXCEPTION WHEN others THEN NULL;
END $$;

-- ─── 10. Calendar Events ─────────────────────────────────
CREATE TABLE IF NOT EXISTS calendar_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  event_type  VARCHAR(50) DEFAULT 'custom', -- 'live_class','assignment_due','quiz_due','custom'
  start_at    TIMESTAMPTZ NOT NULL,
  end_at      TIMESTAMPTZ,
  course_id   UUID REFERENCES courses(id) ON DELETE SET NULL,
  is_global   BOOLEAN DEFAULT false, -- true = visible to all students
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_calendar_user ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_date ON calendar_events(start_at);
