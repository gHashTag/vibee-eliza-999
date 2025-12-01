-- Initialize database tables for VIBEE agent
-- This script creates all necessary tables for the agent system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Agents table
CREATE TABLE IF NOT EXISTS agents (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    enabled boolean DEFAULT true NOT NULL,
    owner_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,

    -- Character data
    name text NOT NULL,
    username text,
    system text DEFAULT '',
    bio jsonb DEFAULT '[]'::jsonb,
    message_examples jsonb DEFAULT '[]'::jsonb NOT NULL,
    post_examples jsonb DEFAULT '[]'::jsonb NOT NULL,
    topics jsonb DEFAULT '[]'::jsonb NOT NULL,
    adjectives jsonb DEFAULT '[]'::jsonb NOT NULL,
    knowledge jsonb DEFAULT '[]'::jsonb NOT NULL,
    plugins jsonb DEFAULT '[]'::jsonb NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    style jsonb DEFAULT '{}'::jsonb NOT NULL
);

-- Create index on agent name for faster lookups
CREATE INDEX IF NOT EXISTS idx_agents_name ON agents(name);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_agents_updated_at
    BEFORE UPDATE ON agents
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,

    -- Content
    content text NOT NULL,
    role text NOT NULL,

    -- Relationships
    agent_id uuid REFERENCES agents(id) ON DELETE CASCADE,
    room_id uuid,
    user_id uuid,

    -- Metadata
    embedding vector(1536),
    metadata jsonb DEFAULT '{}'::jsonb
);

-- Create indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_agent_id ON messages(agent_id);
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Memory table
CREATE TABLE IF NOT EXISTS memories (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,

    -- Content
    content text NOT NULL,
    embedding vector(1536),
    metadata jsonb DEFAULT '{}'::jsonb,

    -- Relationships
    agent_id uuid REFERENCES agents(id) ON DELETE CASCADE,
    room_id uuid,
    user_id uuid
);

-- Create indexes for memories
CREATE INDEX IF NOT EXISTS idx_memories_agent_id ON memories(agent_id);
CREATE INDEX IF NOT EXISTS idx_memories_room_id ON memories(room_id);

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,

    -- Room data
    name text NOT NULL,
    source_type text,
    source_id text,
    metadata jsonb DEFAULT '{}'::jsonb
);

-- Create index on room source_id
CREATE INDEX IF NOT EXISTS idx_rooms_source_id ON rooms(source_id);

-- Participants table
CREATE TABLE IF NOT EXISTS participants (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,

    -- Relationships
    user_id uuid NOT NULL,
    room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
    agent_id uuid REFERENCES agents(id) ON DELETE CASCADE,

    -- Participant data
    role text DEFAULT 'member',
    metadata jsonb DEFAULT '{}'::jsonb
);

-- Create indexes for participants
CREATE UNIQUE INDEX IF NOT EXISTS idx_participants_room_user
    ON participants(room_id, user_id);
CREATE INDEX IF NOT EXISTS idx_participants_agent_id ON participants(agent_id);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,

    -- Task data
    name text NOT NULL,
    type text,
    description text,
    status text DEFAULT 'pending',
    priority text DEFAULT 'medium',
    metadata jsonb DEFAULT '{}'::jsonb,

    -- Relationships
    agent_id uuid REFERENCES agents(id) ON DELETE CASCADE,
    room_id uuid,
    user_id uuid
);

-- Create indexes for tasks
CREATE INDEX IF NOT EXISTS idx_tasks_agent_id ON tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_room_id ON tasks(room_id);

-- Message servers table
CREATE TABLE IF NOT EXISTS message_servers (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,

    -- Server data
    name text NOT NULL,
    source_type text,
    source_id text,
    metadata jsonb DEFAULT '{}'::jsonb
);

-- Server agents table
CREATE TABLE IF NOT EXISTS server_agents (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,

    -- Server agent data
    agent_id uuid REFERENCES agents(id) ON DELETE CASCADE,
    server_id uuid REFERENCES message_servers(id) ON DELETE CASCADE,
    status text DEFAULT 'active',

    UNIQUE(agent_id, server_id)
);

-- Insert default server (required by ElizaOS for agent registration)
-- This server must exist for agents to register properly
INSERT INTO message_servers (id, name, source_type, source_id)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'Default Server',
    'local',
    'default'
) ON CONFLICT (id) DO NOTHING;

-- Create trigger for updated_at on messages
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Create trigger for updated_at on memories
CREATE TRIGGER update_memories_updated_at
    BEFORE UPDATE ON memories
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Create trigger for updated_at on rooms
CREATE TRIGGER update_rooms_updated_at
    BEFORE UPDATE ON rooms
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Create trigger for updated_at on participants
CREATE TRIGGER update_participants_updated_at
    BEFORE UPDATE ON participants
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Create trigger for updated_at on tasks
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Create trigger for updated_at on message_servers
CREATE TRIGGER update_message_servers_updated_at
    BEFORE UPDATE ON message_servers
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Create trigger for updated_at on server_agents
CREATE TRIGGER update_server_agents_updated_at
    BEFORE UPDATE ON server_agents
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO current_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO current_user;

COMMIT;
