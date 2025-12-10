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

-- =============================================================================
-- TELEGRAM RAG TABLES - Полный парсинг диалогов с векторным поиском
-- =============================================================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Telegram Dialogs - чаты, группы, каналы
CREATE TABLE IF NOT EXISTS telegram_dialogs (
    id BIGINT PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('user', 'group', 'channel', 'bot')),
    title VARCHAR(500),
    username VARCHAR(100),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    phone VARCHAR(50),
    participants_count INTEGER,
    is_verified BOOLEAN DEFAULT FALSE,
    is_restricted BOOLEAN DEFAULT FALSE,
    last_message_id BIGINT,
    last_parsed_at TIMESTAMPTZ,
    parse_status VARCHAR(20) DEFAULT 'pending' CHECK (parse_status IN ('pending', 'in_progress', 'completed', 'failed')),
    total_messages INTEGER DEFAULT 0,
    parsed_messages INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Telegram Messages - сообщения с embeddings
CREATE TABLE IF NOT EXISTS telegram_messages (
    id BIGSERIAL PRIMARY KEY,
    message_id BIGINT NOT NULL,
    dialog_id BIGINT NOT NULL REFERENCES telegram_dialogs(id) ON DELETE CASCADE,
    sender_id BIGINT,
    sender_name VARCHAR(255),
    content_type VARCHAR(50) DEFAULT 'text' CHECK (content_type IN ('text', 'photo', 'voice', 'video', 'document', 'sticker', 'animation', 'video_note', 'audio', 'contact', 'location', 'poll', 'other')),
    text_content TEXT,
    media_id BIGINT,
    reply_to_id BIGINT,
    forward_from_id BIGINT,
    forward_from_name VARCHAR(255),
    views_count INTEGER,
    forwards_count INTEGER,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_edited BOOLEAN DEFAULT FALSE,
    edit_date TIMESTAMPTZ,
    timestamp TIMESTAMPTZ NOT NULL,
    -- Embedding fields
    embedding VECTOR(1536),
    embedding_model VARCHAR(50),
    embedding_created_at TIMESTAMPTZ,
    -- Metadata
    raw_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(dialog_id, message_id)
);

-- 3. Telegram Media - медиа файлы с анализом
CREATE TABLE IF NOT EXISTS telegram_media (
    id BIGSERIAL PRIMARY KEY,
    message_id BIGINT NOT NULL,
    dialog_id BIGINT NOT NULL REFERENCES telegram_dialogs(id) ON DELETE CASCADE,
    media_type VARCHAR(50) NOT NULL CHECK (media_type IN ('photo', 'voice', 'video', 'document', 'audio', 'sticker', 'animation', 'video_note')),
    file_id VARCHAR(255),
    file_unique_id VARCHAR(255),
    file_path VARCHAR(500),
    file_name VARCHAR(255),
    file_size BIGINT,
    mime_type VARCHAR(100),
    width INTEGER,
    height INTEGER,
    duration_seconds INTEGER,
    -- Voice/Audio transcription
    transcription TEXT,
    transcription_model VARCHAR(50),
    transcription_language VARCHAR(10),
    transcription_confidence FLOAT,
    transcription_created_at TIMESTAMPTZ,
    -- Photo/Video analysis (Claude Vision)
    image_description TEXT,
    image_ocr_text TEXT,
    image_objects JSONB,  -- detected objects/labels
    vision_model VARCHAR(50),
    vision_created_at TIMESTAMPTZ,
    -- Content embedding (for transcriptions/descriptions)
    content_embedding VECTOR(1536),
    embedding_model VARCHAR(50),
    -- Processing status
    process_status VARCHAR(20) DEFAULT 'pending' CHECK (process_status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
    process_error TEXT,
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Parse Jobs - отслеживание задач парсинга
CREATE TABLE IF NOT EXISTS telegram_parse_jobs (
    id BIGSERIAL PRIMARY KEY,
    job_type VARCHAR(50) NOT NULL CHECK (job_type IN ('full_sync', 'dialog_sync', 'media_process', 'embedding_generate')),
    dialog_id BIGINT REFERENCES telegram_dialogs(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    progress_current INTEGER DEFAULT 0,
    progress_total INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    config JSONB,  -- job configuration (batch_size, delay_ms, etc)
    result JSONB,  -- job results summary
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES для быстрого поиска
-- =============================================================================

-- Dialog indexes
CREATE INDEX IF NOT EXISTS idx_dialogs_type ON telegram_dialogs(type);
CREATE INDEX IF NOT EXISTS idx_dialogs_parse_status ON telegram_dialogs(parse_status);
CREATE INDEX IF NOT EXISTS idx_dialogs_username ON telegram_dialogs(username) WHERE username IS NOT NULL;

-- Message indexes
CREATE INDEX IF NOT EXISTS idx_tg_messages_dialog ON telegram_messages(dialog_id);
CREATE INDEX IF NOT EXISTS idx_tg_messages_timestamp ON telegram_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_tg_messages_sender ON telegram_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_tg_messages_content_type ON telegram_messages(content_type);
CREATE INDEX IF NOT EXISTS idx_tg_messages_no_embedding ON telegram_messages(dialog_id)
    WHERE embedding IS NULL AND text_content IS NOT NULL AND LENGTH(text_content) > 10;

-- Media indexes
CREATE INDEX IF NOT EXISTS idx_media_dialog ON telegram_media(dialog_id);
CREATE INDEX IF NOT EXISTS idx_media_type ON telegram_media(media_type);
CREATE INDEX IF NOT EXISTS idx_media_process_status ON telegram_media(process_status);
CREATE INDEX IF NOT EXISTS idx_media_pending ON telegram_media(id)
    WHERE process_status = 'pending';

-- Parse jobs indexes
CREATE INDEX IF NOT EXISTS idx_parse_jobs_status ON telegram_parse_jobs(status);
CREATE INDEX IF NOT EXISTS idx_parse_jobs_dialog ON telegram_parse_jobs(dialog_id);

-- =============================================================================
-- VECTOR INDEXES (HNSW для быстрого семантического поиска)
-- =============================================================================

-- Message embeddings index (создаётся после наполнения данными)
-- HNSW: m=16 (connections), ef_construction=64 (build quality)
CREATE INDEX IF NOT EXISTS idx_tg_messages_embedding ON telegram_messages
    USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

-- Media content embeddings index
CREATE INDEX IF NOT EXISTS idx_media_embedding ON telegram_media
    USING hnsw (content_embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

-- =============================================================================
-- FULL-TEXT SEARCH (для гибридного поиска)
-- =============================================================================

-- Добавляем tsvector колонку для полнотекстового поиска (русский + английский)
ALTER TABLE telegram_messages ADD COLUMN IF NOT EXISTS text_search tsvector
    GENERATED ALWAYS AS (
        setweight(to_tsvector('russian', COALESCE(text_content, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(text_content, '')), 'B')
    ) STORED;

-- GIN индекс для полнотекстового поиска
CREATE INDEX IF NOT EXISTS idx_tg_messages_fts ON telegram_messages USING gin(text_search);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER update_telegram_dialogs_updated_at
    BEFORE UPDATE ON telegram_dialogs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_telegram_media_updated_at
    BEFORE UPDATE ON telegram_media
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_telegram_parse_jobs_updated_at
    BEFORE UPDATE ON telegram_parse_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Функция для гибридного поиска (vector + keyword с RRF)
CREATE OR REPLACE FUNCTION hybrid_search(
    query_embedding VECTOR(1536),
    query_text TEXT,
    match_count INT DEFAULT 20,
    rrf_k INT DEFAULT 60
)
RETURNS TABLE (
    message_id BIGINT,
    dialog_id BIGINT,
    text_content TEXT,
    timestamp TIMESTAMPTZ,
    sender_name VARCHAR,
    vector_rank INT,
    keyword_rank INT,
    rrf_score FLOAT
) AS $$
WITH vector_search AS (
    SELECT
        id,
        ROW_NUMBER() OVER (ORDER BY embedding <=> query_embedding) AS rank
    FROM telegram_messages
    WHERE embedding IS NOT NULL
    ORDER BY embedding <=> query_embedding
    LIMIT match_count * 2
),
keyword_search AS (
    SELECT
        id,
        ROW_NUMBER() OVER (ORDER BY ts_rank(text_search, websearch_to_tsquery('russian', query_text)) DESC) AS rank
    FROM telegram_messages
    WHERE text_search @@ websearch_to_tsquery('russian', query_text)
    ORDER BY ts_rank(text_search, websearch_to_tsquery('russian', query_text)) DESC
    LIMIT match_count * 2
)
SELECT
    m.message_id,
    m.dialog_id,
    m.text_content,
    m.timestamp,
    m.sender_name,
    COALESCE(v.rank, 9999)::INT AS vector_rank,
    COALESCE(k.rank, 9999)::INT AS keyword_rank,
    (COALESCE(1.0 / (rrf_k + v.rank), 0.0) + COALESCE(1.0 / (rrf_k + k.rank), 0.0))::FLOAT AS rrf_score
FROM telegram_messages m
LEFT JOIN vector_search v ON m.id = v.id
LEFT JOIN keyword_search k ON m.id = k.id
WHERE v.id IS NOT NULL OR k.id IS NOT NULL
ORDER BY rrf_score DESC
LIMIT match_count;
$$ LANGUAGE SQL STABLE;

-- Функция для получения статистики парсинга
CREATE OR REPLACE FUNCTION get_parse_stats()
RETURNS TABLE (
    total_dialogs BIGINT,
    parsed_dialogs BIGINT,
    total_messages BIGINT,
    messages_with_embedding BIGINT,
    total_media BIGINT,
    processed_media BIGINT,
    pending_jobs BIGINT
) AS $$
SELECT
    (SELECT COUNT(*) FROM telegram_dialogs),
    (SELECT COUNT(*) FROM telegram_dialogs WHERE parse_status = 'completed'),
    (SELECT COUNT(*) FROM telegram_messages),
    (SELECT COUNT(*) FROM telegram_messages WHERE embedding IS NOT NULL),
    (SELECT COUNT(*) FROM telegram_media),
    (SELECT COUNT(*) FROM telegram_media WHERE process_status = 'completed'),
    (SELECT COUNT(*) FROM telegram_parse_jobs WHERE status IN ('pending', 'running'));
$$ LANGUAGE SQL STABLE;
