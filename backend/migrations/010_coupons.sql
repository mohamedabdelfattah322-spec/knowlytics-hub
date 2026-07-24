-- ============================================================
--  Discount coupons for online course purchases
-- ============================================================

DO $$ BEGIN
  CREATE TYPE discount_type AS ENUM ('percent', 'fixed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS coupons (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code            VARCHAR(40) UNIQUE NOT NULL,
  description     TEXT,
  discount_type   discount_type NOT NULL DEFAULT 'percent',
  discount_value  NUMERIC(10,2) NOT NULL,   -- 25 = 25% if type=percent, or 25 EGP if type=fixed
  -- Targeting
  course_id       UUID REFERENCES courses(id) ON DELETE CASCADE, -- NULL = applies to all courses
  audience        VARCHAR(150),  -- e.g., "Acme Inc", "VIP", or null = anyone
  -- Limits
  max_uses        INT,           -- total uses cap (null = unlimited)
  max_uses_per_user INT NOT NULL DEFAULT 1,
  used_count      INT NOT NULL DEFAULT 0,
  -- Validity
  valid_from      TIMESTAMPTZ,
  valid_until     TIMESTAMPTZ,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_course ON coupons(course_id);

CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id     UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id     UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  payment_id    UUID REFERENCES payments(id) ON DELETE SET NULL,
  amount_off    NUMERIC(10,2) NOT NULL,
  redeemed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_redemptions_coupon ON coupon_redemptions(coupon_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_user ON coupon_redemptions(user_id);
