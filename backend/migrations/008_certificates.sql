-- ============================================================
--  Course completion certificates
-- ============================================================
CREATE TABLE IF NOT EXISTS certificates (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id    UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  batch_id     UUID REFERENCES course_batches(id) ON DELETE SET NULL,
  serial_no    VARCHAR(40) UNIQUE NOT NULL,
  final_grade  NUMERIC(5,2),
  issued_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, course_id, batch_id)
);
CREATE INDEX IF NOT EXISTS idx_cert_user ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_cert_course ON certificates(course_id);
