-- ============================================================
--  Payments table — track Paymob transactions
-- ============================================================

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'success', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Add payment_ref to enrollments if missing
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS payment_ref VARCHAR(255);

CREATE TABLE IF NOT EXISTS payments (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id          UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  amount             NUMERIC(10,2) NOT NULL,
  currency           VARCHAR(10) NOT NULL DEFAULT 'EGP',
  status             payment_status NOT NULL DEFAULT 'pending',
  paymob_order_id    VARCHAR(100),
  paymob_txn_id      VARCHAR(100) UNIQUE,
  payment_method     VARCHAR(50),
  customer_phone     VARCHAR(30),
  customer_email     VARCHAR(255),
  raw_response       JSONB,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at            TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payments_user     ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_course   ON payments(course_id);
CREATE INDEX IF NOT EXISTS idx_payments_status   ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_paymob   ON payments(paymob_order_id);
