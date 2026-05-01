-- ============================================================
--  Knowlytics Hub — Sample Seed Data
--  Passwords are all: "Password123!"
--  Hash generated with bcrypt cost 12
-- ============================================================

-- ─── Admin User ──────────────────────────────────────────
INSERT INTO users (id, name, email, password_hash, role) VALUES
  ('00000000-0000-0000-0000-000000000001',
   'Admin User',
   'admin@knowlytics.com',
   '$2a$12$rBYYtC2Da01sSyMEcon7uea3lxTvtz5SJOk3RWBr25GxuX07juYUK', -- Password123!
   'admin')
ON CONFLICT DO NOTHING;

-- ─── Students ────────────────────────────────────────────
INSERT INTO users (id, name, email, password_hash, role, student_type) VALUES
  ('00000000-0000-0000-0000-000000000002',
   'Sara Ahmed',
   'sara@example.com',
   '$2a$12$rBYYtC2Da01sSyMEcon7uea3lxTvtz5SJOk3RWBr25GxuX07juYUK',
   'student', 'online'),
  ('00000000-0000-0000-0000-000000000003',
   'Omar Hassan',
   'omar@example.com',
   '$2a$12$rBYYtC2Da01sSyMEcon7uea3lxTvtz5SJOk3RWBr25GxuX07juYUK',
   'student', 'live'),
  ('00000000-0000-0000-0000-000000000004',
   'Lina Khalil',
   'lina@example.com',
   '$2a$12$rBYYtC2Da01sSyMEcon7uea3lxTvtz5SJOk3RWBr25GxuX07juYUK',
   'student', 'online')
ON CONFLICT DO NOTHING;

-- ─── Courses ─────────────────────────────────────────────
INSERT INTO courses (id, title, description, type, level, price, duration_hours, is_published, instructor_id) VALUES
  ('10000000-0000-0000-0000-000000000001',
   'Full-Stack Web Development Bootcamp',
   'Master HTML, CSS, JavaScript, React, Node.js, and PostgreSQL from zero to production.',
   'online', 'Beginner', 299.00, 40, true,
   '00000000-0000-0000-0000-000000000001'),

  ('10000000-0000-0000-0000-000000000002',
   'Advanced React & Next.js Masterclass',
   'Deep-dive into React 18, Next.js App Router, Server Components, and full-stack patterns.',
   'live', 'Advanced', 399.00, 20, true,
   '00000000-0000-0000-0000-000000000001'),

  ('10000000-0000-0000-0000-000000000003',
   'Python for Data Science',
   'Pandas, NumPy, Matplotlib, Scikit-learn — everything you need for data analysis.',
   'online', 'Intermediate', 199.00, 25, true,
   '00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- ─── Sections ────────────────────────────────────────────
INSERT INTO sections (id, course_id, title, order_index) VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'HTML & CSS Fundamentals', 0),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'JavaScript Essentials', 1),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'React Basics', 2),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'Next.js App Router', 0),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', 'Server Components', 1)
ON CONFLICT DO NOTHING;

-- ─── Lessons ─────────────────────────────────────────────
INSERT INTO lessons (id, section_id, title, type, duration_minutes, order_index, is_preview) VALUES
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Introduction to HTML', 'video', 15, 0, true),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'CSS Selectors & Box Model', 'video', 20, 1, false),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'Flexbox & Grid Layout', 'video', 25, 2, false),
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002', 'Variables & Data Types', 'video', 18, 0, false),
  ('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000002', 'Functions & Scope', 'video', 22, 1, false),
  ('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000003', 'JSX & Components', 'video', 20, 0, false),
  ('30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000003', 'useState & useEffect', 'video', 30, 1, false)
ON CONFLICT DO NOTHING;

-- ─── Quizzes ─────────────────────────────────────────────
INSERT INTO quizzes (id, section_id, title, description) VALUES
  ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'HTML & CSS Quiz', 'Test your knowledge of HTML & CSS basics'),
  ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'JavaScript Fundamentals Quiz', 'Check your JS understanding')
ON CONFLICT DO NOTHING;

-- ─── Quiz Questions ──────────────────────────────────────
INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, points, order_index) VALUES
  ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'What does HTML stand for?', 'multiple_choice', 1, 0),
  ('50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 'Which CSS property controls text color?', 'multiple_choice', 1, 1),
  ('50000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000001', 'Which HTML tag creates a hyperlink?', 'multiple_choice', 1, 2),
  ('50000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000002', 'What keyword declares a variable in modern JS?', 'multiple_choice', 1, 0),
  ('50000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000002', 'What does === check in JavaScript?', 'multiple_choice', 1, 1)
ON CONFLICT DO NOTHING;

-- ─── Quiz Answers ────────────────────────────────────────
INSERT INTO quiz_answers (question_id, answer_text, is_correct, order_index) VALUES
  -- Q1: HTML meaning
  ('50000000-0000-0000-0000-000000000001', 'HyperText Markup Language', true, 0),
  ('50000000-0000-0000-0000-000000000001', 'HighText Machine Language', false, 1),
  ('50000000-0000-0000-0000-000000000001', 'HyperText Machine Language', false, 2),
  ('50000000-0000-0000-0000-000000000001', 'HyperTransfer Markup Language', false, 3),
  -- Q2: CSS color
  ('50000000-0000-0000-0000-000000000002', 'color', true, 0),
  ('50000000-0000-0000-0000-000000000002', 'font-color', false, 1),
  ('50000000-0000-0000-0000-000000000002', 'text-color', false, 2),
  ('50000000-0000-0000-0000-000000000002', 'background-color', false, 3),
  -- Q3: hyperlink tag
  ('50000000-0000-0000-0000-000000000003', '<a>', true, 0),
  ('50000000-0000-0000-0000-000000000003', '<href>', false, 1),
  ('50000000-0000-0000-0000-000000000003', '<link>', false, 2),
  ('50000000-0000-0000-0000-000000000003', '<nav>', false, 3),
  -- Q4: JS variable
  ('50000000-0000-0000-0000-000000000004', 'const / let', true, 0),
  ('50000000-0000-0000-0000-000000000004', 'var only', false, 1),
  ('50000000-0000-0000-0000-000000000004', 'def', false, 2),
  ('50000000-0000-0000-0000-000000000004', 'dim', false, 3),
  -- Q5: === check
  ('50000000-0000-0000-0000-000000000005', 'Value and type equality', true, 0),
  ('50000000-0000-0000-0000-000000000005', 'Value equality only', false, 1),
  ('50000000-0000-0000-0000-000000000005', 'Type equality only', false, 2),
  ('50000000-0000-0000-0000-000000000005', 'Reference equality', false, 3)
ON CONFLICT DO NOTHING;

-- ─── Enrollments ─────────────────────────────────────────
INSERT INTO enrollments (user_id, course_id, progress_pct) VALUES
  ('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 45),
  ('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 10),
  ('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 0),
  ('00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 80)
ON CONFLICT DO NOTHING;
