-- ═══════════════════════════════════════════════════════════
--  016 — Advanced Analytics: Video, Cart, Page Views, Events
-- ═══════════════════════════════════════════════════════════

-- Video watch sessions — one row per play session
CREATE TABLE IF NOT EXISTS video_watch_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,         -- actual seconds watched
  video_total_seconds INTEGER DEFAULT 0,      -- total video length
  max_position_seconds INTEGER DEFAULT 0,     -- furthest point reached
  completed BOOLEAN DEFAULT false,            -- watched ≥80%
  play_count INTEGER DEFAULT 1,               -- how many times play was pressed
  pause_count INTEGER DEFAULT 0,
  seek_forward_count INTEGER DEFAULT 0,
  seek_backward_count INTEGER DEFAULT 0,
  replay_count INTEGER DEFAULT 0,             -- went back to start
  speed_changes INTEGER DEFAULT 0,
  last_speed REAL DEFAULT 1.0,
  fullscreen_count INTEGER DEFAULT 0,
  buffer_count INTEGER DEFAULT 0,             -- buffering events
  device_type VARCHAR(20) DEFAULT 'desktop',  -- desktop/mobile/tablet
  browser VARCHAR(100),
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vws_user ON video_watch_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_vws_lesson ON video_watch_sessions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_vws_course ON video_watch_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_vws_started ON video_watch_sessions(started_at);

-- Video seek/interaction events — detailed log
CREATE TABLE IF NOT EXISTS video_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES video_watch_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  event_type VARCHAR(30) NOT NULL,  -- play, pause, seek, speed_change, buffer, ended, fullscreen, tab_hidden, tab_visible
  from_seconds REAL,
  to_seconds REAL,
  data JSONB DEFAULT '{}',          -- extra info: speed value, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ve_session ON video_events(session_id);
CREATE INDEX IF NOT EXISTS idx_ve_user ON video_events(user_id);
CREATE INDEX IF NOT EXISTS idx_ve_type ON video_events(event_type);

-- Cart events — track adds, removes, abandonment
CREATE TABLE IF NOT EXISTS cart_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  bundle_id UUID REFERENCES bundles(id) ON DELETE SET NULL,
  event_type VARCHAR(30) NOT NULL,  -- add_to_cart, remove_from_cart, checkout_start, checkout_complete, checkout_abandon
  payment_method VARCHAR(50),       -- paymob, stripe, fawry, vodafone_cash, etc.
  amount NUMERIC(10,2) DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ce_user ON cart_events(user_id);
CREATE INDEX IF NOT EXISTS idx_ce_course ON cart_events(course_id);
CREATE INDEX IF NOT EXISTS idx_ce_type ON cart_events(event_type);
CREATE INDEX IF NOT EXISTS idx_ce_created ON cart_events(created_at);

-- Page view events
CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  page_path VARCHAR(500) NOT NULL,
  referrer VARCHAR(500),
  device_type VARCHAR(20) DEFAULT 'desktop',
  browser VARCHAR(100),
  session_duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pv_user ON page_views(user_id);
CREATE INDEX IF NOT EXISTS idx_pv_path ON page_views(page_path);
CREATE INDEX IF NOT EXISTS idx_pv_created ON page_views(created_at);

-- Course engagement summary — aggregated daily
CREATE TABLE IF NOT EXISTS course_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  stat_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_watch_seconds INTEGER DEFAULT 0,
  unique_viewers INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  avg_session_seconds INTEGER DEFAULT 0,
  completions INTEGER DEFAULT 0,
  cart_adds INTEGER DEFAULT 0,
  cart_removes INTEGER DEFAULT 0,
  purchases INTEGER DEFAULT 0,
  revenue NUMERIC(10,2) DEFAULT 0,
  page_views INTEGER DEFAULT 0,
  UNIQUE(course_id, stat_date)
);

CREATE INDEX IF NOT EXISTS idx_cds_course ON course_daily_stats(course_id);
CREATE INDEX IF NOT EXISTS idx_cds_date ON course_daily_stats(stat_date);

-- User engagement summary — aggregated daily
CREATE TABLE IF NOT EXISTS user_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stat_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_watch_seconds INTEGER DEFAULT 0,
  lessons_watched INTEGER DEFAULT 0,
  lessons_completed INTEGER DEFAULT 0,
  quizzes_taken INTEGER DEFAULT 0,
  pages_viewed INTEGER DEFAULT 0,
  login_count INTEGER DEFAULT 1,
  UNIQUE(user_id, stat_date)
);

CREATE INDEX IF NOT EXISTS idx_uds_user ON user_daily_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_uds_date ON user_daily_stats(stat_date);
