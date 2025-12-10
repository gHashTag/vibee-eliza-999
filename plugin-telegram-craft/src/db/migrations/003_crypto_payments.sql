-- Migration: 003_crypto_payments
-- Add crypto payment tracking fields to user_photo_quota

-- Добавляем поля для отслеживания крипто-платежей
ALTER TABLE user_photo_quota
  ADD COLUMN IF NOT EXISTS total_spent_ton DECIMAL(20,9) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_spent_usdt DECIMAL(20,6) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_spent_not BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_spent_rub DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_payment_source VARCHAR(20);

-- Комментарии к полям
COMMENT ON COLUMN user_photo_quota.total_spent_ton IS 'Total TON spent by user';
COMMENT ON COLUMN user_photo_quota.total_spent_usdt IS 'Total USDT spent by user';
COMMENT ON COLUMN user_photo_quota.total_spent_not IS 'Total NOT (Notcoin) spent by user';
COMMENT ON COLUMN user_photo_quota.total_spent_rub IS 'Total RUB spent by user (via @push auto-convert)';
COMMENT ON COLUMN user_photo_quota.last_payment_source IS 'Source of last payment: stars, ton, usdt, not, rub';

-- Таблица истории платежей для аудита
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Связь с пользователем
  telegram_id VARCHAR(50) NOT NULL,

  -- Детали платежа
  payment_type VARCHAR(20) NOT NULL, -- 'stars', 'crypto'
  currency VARCHAR(10) NOT NULL,     -- 'XTR', 'TON', 'USDT', 'NOT', 'RUB'
  amount DECIMAL(20,9) NOT NULL,

  -- Зачисленные кредиты
  credits_added INTEGER NOT NULL,

  -- Источник платежа
  source_bot VARCHAR(50),            -- '@push', '@Wallet', '@CryptoBot'
  transaction_id VARCHAR(100),       -- ID транзакции если есть
  raw_message TEXT,                  -- Оригинальное сообщение о платеже

  -- Метаданные
  chat_id VARCHAR(50),
  message_id BIGINT,

  -- Даты
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_payment_history_telegram_id
  ON payment_history(telegram_id);

CREATE INDEX IF NOT EXISTS idx_payment_history_created_at
  ON payment_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_history_currency
  ON payment_history(currency);
