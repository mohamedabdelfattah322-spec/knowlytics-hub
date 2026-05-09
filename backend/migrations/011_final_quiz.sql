-- ============================================================
--  Final exam: distinguish final quizzes + passing threshold
-- ============================================================
ALTER TABLE quizzes
  ADD COLUMN IF NOT EXISTS is_final BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS passing_score SMALLINT NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_quizzes_course_final ON quizzes(course_id, is_final);
