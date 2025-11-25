-- Migration: Create VIBEE users, sessions, and secret access logs tables
-- Created: 2024-11-25

-- Create vibee_users table
CREATE TABLE IF NOT EXISTS vibee_users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    photo_url TEXT,
    is_premium BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_login_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    settings JSON DEFAULT '{}' NOT NULL,
    usage_stats JSON DEFAULT '{}' NOT NULL
);

-- Create indexes for vibee_users
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON vibee_users (telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON vibee_users (created_at);

-- Create vibee_user_sessions table
CREATE TABLE IF NOT EXISTS vibee_user_sessions (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    jwt_token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_used_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    ip_address VARCHAR(50),
    user_agent TEXT,
    device_type VARCHAR(50)
);

-- Create indexes for vibee_user_sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON vibee_user_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_jwt_token ON vibee_user_sessions (jwt_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON vibee_user_sessions (expires_at);

-- Create vibee_secret_access_logs table
CREATE TABLE IF NOT EXISTS vibee_secret_access_logs (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    secret_path TEXT NOT NULL,
    action VARCHAR(50) NOT NULL, -- read, write, delete
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for vibee_secret_access_logs
CREATE INDEX IF NOT EXISTS idx_secret_logs_user_id ON vibee_secret_access_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_secret_logs_created_at ON vibee_secret_access_logs (created_at);

-- Add foreign key constraint for user_sessions
ALTER TABLE vibee_user_sessions
    ADD CONSTRAINT fk_sessions_user_id
    FOREIGN KEY (user_id) REFERENCES vibee_users(id) ON DELETE CASCADE;

-- Add foreign key constraint for secret_access_logs
ALTER TABLE vibee_secret_access_logs
    ADD CONSTRAINT fk_secret_logs_user_id
    FOREIGN KEY (user_id) REFERENCES vibee_users(id) ON DELETE CASCADE;

-- Add triggers to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vibee_users_updated_at
    BEFORE UPDATE ON vibee_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
