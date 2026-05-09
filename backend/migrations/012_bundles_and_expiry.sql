-- ============================================================
--  Course access duration + All-Access Bundles
-- ============================================================

-- Per-enrollment expiration date (NULL = lifetime)
ALTER TABLE enrollments
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Per-course default duration (days). 0 = lifetime (default).
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS default_access_days INT NOT NULL DEFAULT 0;

-- Bundles (e.g., "All Access — Yearly")
CREATE TABLE IF NOT EXISTS bundles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(150) NOT NULL,
  description   TEXT,
  price         NUMERIC(10,2) NOT NULL,
  duration_days INT NOT NULL DEFAULT 365,  -- 0 = lifetime
  thumbnail_url TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optional: limit a bundle to certain courses (else = ALL courses)
CREATE TABLE IF NOT EXISTS bundle_courses (
  bundle_id  UUID NOT NULL REFERENCES bundles(id) ON DELETE CASCADE,
  course_id  UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  PRIMARY KEY (bundle_id, course_id)
);

-- User's active bundle subscriptions
CREATE TABLE IF NOT EXISTS bundle_subscriptions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bundle_id   UUID NOT NULL REFERENCES bundles(id) ON DELETE CASCADE,
  payment_id  UUID REFERENCES payments(id) ON DELETE SET NULL,
  started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bundle_subs_user ON bundle_subscriptions(user_id);

-- Add bundle_id to payments (reuse payments table for both course + bundle)
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS bundle_id UUID REFERENCES bundles(id) ON DELETE SET NULL;

-- Allow course_id to be nullable now (for bundle payments)
ALTER TABLE payments ALTER COLUMN course_id DROP NOT NULL;
