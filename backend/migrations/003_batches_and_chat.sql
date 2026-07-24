-- ============================================================
--  Course Batches + Chat — for Live courses with multiple cohorts
-- ============================================================

-- Each course can have multiple time-bounded batches (groups/cohorts)
CREATE TABLE IF NOT EXISTS course_batches (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id    UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name         VARCHAR(150) NOT NULL,
  description  TEXT,
  start_date   DATE,
  end_date     DATE,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_batches_course ON course_batches(course_id);

-- Tie enrollment to a specific batch (nullable for online/recorded courses)
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES course_batches(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_enrollments_batch ON enrollments(batch_id);

-- Batch-specific lessons/recordings (e.g. zoom replays for that group only)
CREATE TABLE IF NOT EXISTS batch_recordings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id        UUID NOT NULL REFERENCES course_batches(id) ON DELETE CASCADE,
  title           VARCHAR(255) NOT NULL,
  video_key       TEXT,           -- S3 key or local path
  recording_url   TEXT,           -- Zoom direct URL fallback
  duration_minutes SMALLINT,
  recorded_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_batch_rec_batch ON batch_recordings(batch_id);

-- Chat messages (one channel per batch)
CREATE TABLE IF NOT EXISTS batch_messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id    UUID NOT NULL REFERENCES course_batches(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_msg_batch ON batch_messages(batch_id, created_at DESC);
