-- ============================================================
--  Course-level feedback (separate from batch feedback)
-- ============================================================
CREATE TABLE IF NOT EXISTS course_feedback (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id    UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind         feedback_kind NOT NULL,
  rating       SMALLINT,
  expectations TEXT,
  highlights   TEXT,
  improvements TEXT,
  recommend    BOOLEAN,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (course_id, user_id, kind)
);
CREATE INDEX IF NOT EXISTS idx_course_feedback_course ON course_feedback(course_id);
