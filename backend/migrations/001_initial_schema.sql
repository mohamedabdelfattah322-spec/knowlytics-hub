-- ============================================================
--  Knowlytics Hub — PostgreSQL Schema
--  Run: psql -U postgres -d knowlytics_hub -f 001_initial_schema.sql
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for ILIKE text search

-- ─── ENUM Types ──────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role       AS ENUM ('admin', 'student');
  CREATE TYPE student_type    AS ENUM ('live', 'online');
  CREATE TYPE course_type     AS ENUM ('live', 'online', 'hybrid');
  CREATE TYPE course_level    AS ENUM ('Beginner', 'Intermediate', 'Advanced');
  CREATE TYPE lesson_type     AS ENUM ('video', 'text', 'quiz', 'assignment', 'zoom');
  CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'inactivity');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── users ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'student',
  student_type  student_type DEFAULT 'online',
  avatar_url    TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role  ON users(role);

-- ─── sessions ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT UNIQUE NOT NULL,
  device_id   VARCHAR(255),
  ip_address  INET,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  revoked_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sessions_token   ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- ─── courses ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  type            course_type NOT NULL DEFAULT 'online',
  level           course_level DEFAULT 'Beginner',
  price           NUMERIC(10,2) NOT NULL DEFAULT 0,
  duration_hours  NUMERIC(5,1) DEFAULT 0,
  thumbnail_url   TEXT,
  is_published    BOOLEAN NOT NULL DEFAULT false,
  instructor_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_courses_type      ON courses(type);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published);

-- ─── sections ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sections (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id   UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  order_index SMALLINT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sections_course ON sections(course_id);

-- ─── lessons ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lessons (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id       UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  title            VARCHAR(255) NOT NULL,
  type             lesson_type NOT NULL DEFAULT 'video',
  video_key        TEXT,              -- S3 object key (never exposed directly)
  content          TEXT,              -- rich text for text lessons
  duration_minutes SMALLINT DEFAULT 0,
  order_index      SMALLINT NOT NULL DEFAULT 0,
  is_preview       BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lessons_section ON lessons(section_id);

-- ─── enrollments ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enrollments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id     UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  progress_pct  SMALLINT NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  enrolled_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at  TIMESTAMPTZ,
  last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, course_id)
);
CREATE INDEX IF NOT EXISTS idx_enrollments_user   ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);

-- ─── lesson_progress ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS lesson_progress (
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id     UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed     BOOLEAN NOT NULL DEFAULT false,
  completed_at  TIMESTAMPTZ,
  last_accessed TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  access_count  INT NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, lesson_id)
);

-- ─── quizzes ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quizzes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id  UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── quiz_questions ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS quiz_questions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id        UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text  TEXT NOT NULL,
  question_type  VARCHAR(50) NOT NULL DEFAULT 'multiple_choice',
  points         SMALLINT NOT NULL DEFAULT 1,
  order_index    SMALLINT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_questions_quiz ON quiz_questions(quiz_id);

-- ─── quiz_answers ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quiz_answers (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id  UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  answer_text  TEXT NOT NULL,
  is_correct   BOOLEAN NOT NULL DEFAULT false,
  order_index  SMALLINT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_answers_question ON quiz_answers(question_id);

-- ─── quiz_attempts ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_id        UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  course_id      UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  score_pct      SMALLINT NOT NULL DEFAULT 0,
  earned_points  SMALLINT NOT NULL DEFAULT 0,
  total_points   SMALLINT NOT NULL DEFAULT 0,
  level          VARCHAR(20),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_attempts_user  ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_quiz  ON quiz_attempts(quiz_id);

-- ─── assignments ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assignments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id   UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  due_days    SMALLINT DEFAULT 7,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assignment_submissions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_key      TEXT,
  notes         TEXT,
  grade         SMALLINT,
  feedback      TEXT,
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (assignment_id, user_id)
);

-- ─── course_files ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS course_files (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id  UUID REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id  UUID REFERENCES lessons(id) ON DELETE CASCADE,
  name       VARCHAR(255) NOT NULL,
  file_key   TEXT NOT NULL,
  file_type  VARCHAR(100),
  file_size  BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── notifications ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message    TEXT NOT NULL,
  type       notification_type NOT NULL DEFAULT 'info',
  is_read    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- ─── zoom_meetings ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS zoom_meetings (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id        UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  zoom_meeting_id  VARCHAR(100) UNIQUE NOT NULL,
  join_url         TEXT,
  start_url        TEXT,
  topic            VARCHAR(255),
  start_time       TIMESTAMPTZ,
  duration         SMALLINT,
  recording_url    TEXT,
  recording_ready  BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Trigger: update enrollments.last_activity on lesson_progress touch ──
CREATE OR REPLACE FUNCTION update_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE enrollments e
  SET last_activity = NOW()
  FROM lessons l
  JOIN sections s ON s.id = l.section_id
  WHERE l.id = NEW.lesson_id AND e.user_id = NEW.user_id AND e.course_id = s.course_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_last_activity ON lesson_progress;
CREATE TRIGGER trg_update_last_activity
AFTER INSERT OR UPDATE ON lesson_progress
FOR EACH ROW EXECUTE FUNCTION update_last_activity();
