-- VIBEE Database Schema
-- Инициализационный SQL для PostgreSQL

-- Agents table - хранение состояния агентов
CREATE TABLE IF NOT EXISTS agents (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tone VARCHAR(50) NOT NULL DEFAULT 'friendly',
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    system_prompt TEXT,
    history_limit INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Messages table - история сообщений
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(255) PRIMARY KEY,
    agent_id VARCHAR(255) NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    sender VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) NOT NULL DEFAULT 'text',
    content_text TEXT,
    content_url TEXT,
    content_caption TEXT,
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Telegram sessions table - MTProto сессии
CREATE TABLE IF NOT EXISTS telegram_sessions (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(50) UNIQUE NOT NULL,
    session_data BYTEA NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Knowledge base table - RAG knowledge
CREATE TABLE IF NOT EXISTS knowledge (
    id SERIAL PRIMARY KEY,
    agent_id VARCHAR(255) REFERENCES agents(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    source VARCHAR(500),
    embedding VECTOR(1536), -- для OpenAI embeddings (optional)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_messages_agent_id ON messages(agent_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_agent_id ON knowledge(agent_id);

-- Triggers для updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_agents_updated_at
    BEFORE UPDATE ON agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_telegram_sessions_updated_at
    BEFORE UPDATE ON telegram_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
