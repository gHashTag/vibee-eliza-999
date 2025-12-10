-- Migration: 002_user_photo_quota
-- User Photo Quota for Freemium + Payments

CREATE TABLE IF NOT EXISTS user_photo_quota (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Telegram user ID
  telegram_id VARCHAR(50) NOT NULL UNIQUE,

  -- Freemium лимит
  free_photos_used INTEGER NOT NULL DEFAULT 0,
  free_photos_limit INTEGER NOT NULL DEFAULT 5,

  -- Оплаченные фото
  paid_photos INTEGER NOT NULL DEFAULT 0,
  total_spent_stars INTEGER NOT NULL DEFAULT 0,

  -- Даты
  last_payment_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by telegram_id
CREATE INDEX IF NOT EXISTS idx_user_photo_quota_telegram_id
  ON user_photo_quota(telegram_id);

-- Trigger для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_user_photo_quota_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_photo_quota_updated_at ON user_photo_quota;
CREATE TRIGGER trigger_user_photo_quota_updated_at
  BEFORE UPDATE ON user_photo_quota
  FOR EACH ROW
  EXECUTE FUNCTION update_user_photo_quota_updated_at();
