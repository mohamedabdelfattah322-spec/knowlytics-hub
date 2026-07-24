-- ═══════════════════════════════════════════════════════════
--  018 — Discussion Forum (Course & Lesson Discussions)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS discussion_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,  -- NULL = general course discussion
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(300) NOT NULL,
  body TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  upvotes INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dt_course ON discussion_threads(course_id);
CREATE INDEX IF NOT EXISTS idx_dt_lesson ON discussion_threads(lesson_id);
CREATE INDEX IF NOT EXISTS idx_dt_user ON discussion_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_dt_activity ON discussion_threads(last_activity_at DESC);

CREATE TABLE IF NOT EXISTS discussion_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES discussion_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES discussion_replies(id) ON DELETE CASCADE,  -- nested replies
  body TEXT NOT NULL,
  is_answer BOOLEAN DEFAULT false,       -- marked as answer by instructor/admin
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dr_thread ON discussion_replies(thread_id);
CREATE INDEX IF NOT EXISTS idx_dr_user ON discussion_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_dr_parent ON discussion_replies(parent_id);

-- Upvote tracking (prevent duplicates)
CREATE TABLE IF NOT EXISTS discussion_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES discussion_threads(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES discussion_replies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, thread_id),
  UNIQUE(user_id, reply_id)
);
