-- ============================================================
--  Add live session fields to course_batches
-- ============================================================
ALTER TABLE course_batches
  ADD COLUMN IF NOT EXISTS live_url TEXT,
  ADD COLUMN IF NOT EXISTS next_session_at TIMESTAMPTZ;
