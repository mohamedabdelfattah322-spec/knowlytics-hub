-- ============================================================
--  013 — Lesson Notes, Bookmarks, Refunds, Newsletter
-- ============================================================

-- ─── lesson_notes ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lesson_notes (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id        UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  content          TEXT NOT NULL,
  video_timestamp  INT NOT NULL DEFAULT 0,  -- seconds into video
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lesson_notes_user   ON lesson_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_notes_lesson ON lesson_notes(lesson_id);

-- ─── lesson_bookmarks ────────────────────────────────────
CREATE TABLE IF NOT EXISTS lesson_bookmarks (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id        UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  video_timestamp  INT NOT NULL DEFAULT 0,
  label            VARCHAR(120),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, lesson_id, video_timestamp)
);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user   ON lesson_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_lesson ON lesson_bookmarks(lesson_id);

-- ─── refund_requests ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS refund_requests (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id   UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  admin_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  reason       TEXT,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── broadcast_emails ────────────────────────────────────
CREATE TABLE IF NOT EXISTS broadcast_emails (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  subject     VARCHAR(255) NOT NULL,
  body_html   TEXT NOT NULL,
  audience    VARCHAR(50) NOT NULL DEFAULT 'all',  -- 'all' | 'live' | 'online' | 'enrolled:<course_id>'
  sent_count  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Add link column to notifications ─────────────────────
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link TEXT;
