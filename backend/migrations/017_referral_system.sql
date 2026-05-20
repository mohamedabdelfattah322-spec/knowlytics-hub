-- ═══════════════════════════════════════════════════════════
--  017 — Referral / Affiliate System
-- ═══════════════════════════════════════════════════════════

-- Each user gets a unique referral code
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_earnings NUMERIC(10,2) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0;

-- Generate referral codes for existing users who don't have one
-- (will be done in app code on first access)

-- Referral configuration (admin-managed)
CREATE TABLE IF NOT EXISTS referral_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_reward_type VARCHAR(20) DEFAULT 'percentage',  -- percentage, fixed, credit
  referrer_reward_value NUMERIC(10,2) DEFAULT 10,         -- 10% or fixed EGP
  referee_discount_type VARCHAR(20) DEFAULT 'percentage',  -- percentage, fixed
  referee_discount_value NUMERIC(10,2) DEFAULT 10,         -- 10% discount for new user
  min_purchase_amount NUMERIC(10,2) DEFAULT 0,
  max_reward_per_referral NUMERIC(10,2) DEFAULT 500,
  is_active BOOLEAN DEFAULT true,
  require_purchase BOOLEAN DEFAULT true,                   -- reward only after purchase
  reward_on VARCHAR(20) DEFAULT 'first_purchase',          -- first_purchase, every_purchase, registration
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings if none exist
INSERT INTO referral_settings (referrer_reward_type, referrer_reward_value, referee_discount_type, referee_discount_value)
SELECT 'percentage', 10, 'percentage', 10
WHERE NOT EXISTS (SELECT 1 FROM referral_settings);

-- Referral tracking — every referral event
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'registered',  -- registered, purchased, rewarded, expired
  referee_discount_amount NUMERIC(10,2) DEFAULT 0,
  referrer_reward_amount NUMERIC(10,2) DEFAULT 0,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  rewarded_at TIMESTAMPTZ,
  UNIQUE(referrer_id, referee_id)
);

CREATE INDEX IF NOT EXISTS idx_ref_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_ref_referee ON referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_ref_status ON referrals(status);

-- Referral payouts / withdrawal requests
CREATE TABLE IF NOT EXISTS referral_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',  -- pending, approved, paid, rejected
  payment_method VARCHAR(50),            -- vodafone_cash, instapay, bank_transfer
  payment_details JSONB DEFAULT '{}',    -- phone number, bank details, etc.
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_rp_user ON referral_payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_rp_status ON referral_payouts(status);
