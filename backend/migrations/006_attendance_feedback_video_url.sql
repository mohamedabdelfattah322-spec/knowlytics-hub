-- ============================================================
--  Lesson video URL (Google Drive / YouTube etc.)
--  Batch session attendance
--  Batch feedback (first/last session surveys)
-- ============================================================

-- Allow lessons to use external video URL (Drive/YouTube/Vimeo)
ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Per-recording attendance (each recording = one live session occurrence)
CREATE TABLE IF NOT EXISTS session_attendance (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recording_id    UUID NOT NULL REFERENCES batch_recordings(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  attended        BOOLEAN NOT NULL DEFAULT true,
  joined_at       TIMESTAMPTZ,
  left_at         TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (recording_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_attendance_user ON session_attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_rec  ON session_attendance(recording_id);

-- Feedback table (first / last session)
DO $$ BEGIN
  CREATE TYPE feedback_kind AS ENUM ('first', 'last');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS batch_feedback (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id     UUID NOT NULL REFERENCES course_batches(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind         feedback_kind NOT NULL,
  rating       SMALLINT,           -- 1-5
  expectations TEXT,               -- for "first"
  highlights   TEXT,               -- for "last"
  improvements TEXT,
  recommend    BOOLEAN,            -- would recommend the course
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (batch_id, user_id, kind)
);
CREATE INDEX IF NOT EXISTS idx_feedback_batch ON batch_feedback(batch_id);
