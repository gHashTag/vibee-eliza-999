-- Migration: 001_chat_configs
-- Description: Create tables for chat configs, knowledge sources, and RAG chunks
-- Date: 2024-12-09

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- CHAT CONFIGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS chat_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Chat identification
  chat_id VARCHAR(50) NOT NULL UNIQUE,
  chat_title VARCHAR(255),
  chat_type VARCHAR(20) NOT NULL DEFAULT 'group',

  -- Persona configuration
  persona_name VARCHAR(100) NOT NULL,
  system_prompt TEXT NOT NULL,
  style_rules JSONB NOT NULL,
  response_examples JSONB DEFAULT '[]'::jsonb,

  -- Knowledge sources (JSON array)
  knowledge_sources JSONB DEFAULT '[]'::jsonb,

  -- Triggers and response rules
  trigger_words TEXT[],
  response_probability REAL NOT NULL DEFAULT 1.0,
  require_mention BOOLEAN NOT NULL DEFAULT false,

  -- Sales mode
  sales_mode BOOLEAN NOT NULL DEFAULT false,
  sales_config JSONB,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(100),

  -- Constraints
  CONSTRAINT chat_type_check CHECK (chat_type IN ('group', 'supergroup', 'channel', 'private')),
  CONSTRAINT response_probability_check CHECK (response_probability >= 0 AND response_probability <= 1)
);

-- Indexes for chat_configs
CREATE INDEX IF NOT EXISTS idx_chat_configs_chat_id ON chat_configs(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_configs_is_active ON chat_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_chat_configs_persona ON chat_configs(persona_name);
CREATE INDEX IF NOT EXISTS idx_chat_configs_priority ON chat_configs(priority);

-- ============================================
-- KNOWLEDGE SOURCES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS knowledge_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_config_id UUID REFERENCES chat_configs(id) ON DELETE CASCADE,

  -- Source information
  source_type VARCHAR(20) NOT NULL,
  source_path TEXT NOT NULL,
  source_name VARCHAR(255),

  -- Processing status
  is_processed BOOLEAN NOT NULL DEFAULT false,
  last_processed_at TIMESTAMPTZ,
  chunk_count INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT source_type_check CHECK (source_type IN ('md_directory', 'pdf_file', 'pdf_url', 'web_url', 'json'))
);

-- Indexes for knowledge_sources
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_chat_config ON knowledge_sources(chat_config_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_type ON knowledge_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_processed ON knowledge_sources(is_processed);

-- ============================================
-- KNOWLEDGE CHUNKS TABLE (with pgvector)
-- ============================================

CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES knowledge_sources(id) ON DELETE CASCADE,
  chat_config_id UUID REFERENCES chat_configs(id) ON DELETE CASCADE,

  -- Content
  content TEXT NOT NULL,
  embedding VECTOR(768), -- Ollama nomic-embed-text dimension

  -- Metadata
  chunk_type VARCHAR(20),
  chapter VARCHAR(255),
  title VARCHAR(255),
  tags TEXT[],
  position INTEGER,
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT chunk_type_check CHECK (chunk_type IN ('concept', 'tip', 'example', 'question', 'sales', 'faq', 'general'))
);

-- Indexes for knowledge_chunks
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_source ON knowledge_chunks(source_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_chat_config ON knowledge_chunks(chat_config_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_type ON knowledge_chunks(chunk_type);

-- pgvector index for similarity search (IVFFlat for approximate nearest neighbor)
-- lists = 100 is good for up to ~100k vectors
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding ON knowledge_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================
-- CHAT MESSAGES LOG TABLE (Analytics)
-- ============================================

CREATE TABLE IF NOT EXISTS chat_messages_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_config_id UUID REFERENCES chat_configs(id),

  -- Telegram message info
  telegram_message_id VARCHAR(50),
  chat_id VARCHAR(50) NOT NULL,
  from_user_id VARCHAR(50),
  from_username VARCHAR(100),
  from_first_name VARCHAR(100),

  -- Content
  message_text TEXT,
  bot_response TEXT,

  -- Analytics
  triggers_matched TEXT[],
  knowledge_chunks_used UUID[],
  response_time_ms INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for chat_messages_log
CREATE INDEX IF NOT EXISTS idx_chat_messages_log_chat ON chat_messages_log(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_log_created ON chat_messages_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_log_config ON chat_messages_log(chat_config_id);

-- ============================================
-- TRIGGER FOR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chat_configs_updated_at
  BEFORE UPDATE ON chat_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HELPER FUNCTIONS FOR VECTOR SEARCH
-- ============================================

-- Function to search similar chunks by embedding
CREATE OR REPLACE FUNCTION search_similar_chunks(
  query_embedding VECTOR(768),
  p_chat_config_id UUID,
  p_limit INTEGER DEFAULT 5,
  p_min_similarity REAL DEFAULT 0.7
)
RETURNS TABLE (
  chunk_id UUID,
  content TEXT,
  similarity REAL,
  chunk_type VARCHAR(20),
  chapter VARCHAR(255),
  title VARCHAR(255),
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id AS chunk_id,
    kc.content,
    (1 - (kc.embedding <=> query_embedding))::REAL AS similarity,
    kc.chunk_type,
    kc.chapter,
    kc.title,
    kc.metadata
  FROM knowledge_chunks kc
  WHERE kc.chat_config_id = p_chat_config_id
    AND kc.embedding IS NOT NULL
    AND (1 - (kc.embedding <=> query_embedding)) >= p_min_similarity
  ORDER BY kc.embedding <=> query_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Insert a sample chat config for VIBEE
-- INSERT INTO chat_configs (
--   chat_id, chat_title, chat_type, persona_name, system_prompt, style_rules, is_active
-- ) VALUES (
--   '2643951085',
--   'VIBEE Training Chat',
--   'supergroup',
--   'VIBEE',
--   'Ты ВАЙБИ (VIBEE) - бро-наставник по вайбкодингу с отличным чувством юмора!',
--   '{"adjectives": ["дружелюбный", "весёлый", "практичный"], "slangs": ["бро", "йо", "изи"], "emojisAllowed": false, "language": "ru", "maxResponseLength": 1000, "formality": "casual"}'::jsonb,
--   true
-- );

COMMENT ON TABLE chat_configs IS 'Конфигурации чатов для системы цифрового клона';
COMMENT ON TABLE knowledge_sources IS 'Источники знаний для RAG (MD, PDF, Web)';
COMMENT ON TABLE knowledge_chunks IS 'Разбитые чанки с embeddings для vector search';
COMMENT ON TABLE chat_messages_log IS 'Логи сообщений для аналитики';
