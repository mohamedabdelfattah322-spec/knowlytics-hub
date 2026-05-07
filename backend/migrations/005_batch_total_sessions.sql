-- ============================================================
--  Add total_sessions column to course_batches for progress
-- ============================================================
ALTER TABLE course_batches
  ADD COLUMN IF NOT EXISTS total_sessions SMALLINT DEFAULT 12;
