-- Additional tables to complete the data mapping
-- This migration adds the missing tables identified from microservice analysis

-- 1. Dialogues table for Content Service
CREATE TABLE IF NOT EXISTS dialogues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
    speaker VARCHAR(20) NOT NULL CHECK (speaker IN ('user', 'patient')),
    message TEXT NOT NULL,
    expected_response TEXT,
    order_number INTEGER NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dialogues_scenario_id ON dialogues(scenario_id);
CREATE INDEX idx_dialogues_order ON dialogues(scenario_id, order_number);

-- 2. User Progress table (enhanced version)
CREATE TABLE IF NOT EXISTS user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    current_dialogue_id UUID REFERENCES dialogues(id),
    score DECIMAL(5,2),
    completed_at TIMESTAMP,
    time_spent INTEGER DEFAULT 0, -- in seconds
    attempts INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_scenario_id ON user_progress(scenario_id);
CREATE INDEX idx_user_progress_status ON user_progress(status);
CREATE UNIQUE INDEX idx_user_progress_unique ON user_progress(user_id, scenario_id);

-- 3. Session Data table for Session Service
CREATE TABLE IF NOT EXISTS session_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    device_id VARCHAR(255),
    device_info JSONB,
    ip_address INET NOT NULL,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_session_data_user_id ON session_data(user_id);
CREATE INDEX idx_session_data_is_active ON session_data(is_active);
CREATE INDEX idx_session_data_expires_at ON session_data(expires_at);

-- 4. Session Activity table for Session Service
CREATE TABLE IF NOT EXISTS session_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES session_data(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL CHECK (action IN ('login', 'logout', 'refresh', 'activity', 'expired')),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET NOT NULL,
    user_agent TEXT,
    details JSONB DEFAULT '{}'
);

CREATE INDEX idx_session_activity_session_id ON session_activity(session_id);
CREATE INDEX idx_session_activity_timestamp ON session_activity(timestamp);

-- 5. Practice Sessions table for WebRTC Server
CREATE TABLE IF NOT EXISTS practice_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'error')),
    livekit_room_name VARCHAR(255) NOT NULL,
    livekit_token TEXT,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    duration INTEGER, -- in seconds
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_practice_sessions_user_id ON practice_sessions(user_id);
CREATE INDEX idx_practice_sessions_scenario_id ON practice_sessions(scenario_id);
CREATE INDEX idx_practice_sessions_status ON practice_sessions(status);
CREATE INDEX idx_practice_sessions_room_name ON practice_sessions(livekit_room_name);

-- 6. Session Messages table for WebRTC Server
CREATE TABLE IF NOT EXISTS session_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('audio', 'response', 'audio_quality', 'tts_chunk', 'session_start', 'session_end', 'error')),
    data JSONB NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sequence_number INTEGER NOT NULL,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_session_messages_session_id ON session_messages(session_id);
CREATE INDEX idx_session_messages_timestamp ON session_messages(timestamp);
CREATE INDEX idx_session_messages_sequence ON session_messages(session_id, sequence_number);

-- 7. Media Files table for Content Service
CREATE TABLE IF NOT EXISTS media_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT NOT NULL,
    file_path TEXT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE,
    dialogue_id UUID REFERENCES dialogues(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_media_files_scenario_id ON media_files(scenario_id);
CREATE INDEX idx_media_files_dialogue_id ON media_files(dialogue_id);
CREATE INDEX idx_media_files_file_type ON media_files(file_type);

-- 8. LiveKit Rooms table for WebRTC Server
CREATE TABLE IF NOT EXISTS livekit_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    sid VARCHAR(255) NOT NULL UNIQUE,
    metadata TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_livekit_rooms_name ON livekit_rooms(name);
CREATE INDEX idx_livekit_rooms_sid ON livekit_rooms(sid);

-- 9. LiveKit Participants table for WebRTC Server  
CREATE TABLE IF NOT EXISTS livekit_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES livekit_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    participant_id VARCHAR(255) NOT NULL,
    identity VARCHAR(255) NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_livekit_participants_room_id ON livekit_participants(room_id);
CREATE INDEX idx_livekit_participants_user_id ON livekit_participants(user_id);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_dialogues_updated_at BEFORE UPDATE ON dialogues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_practice_sessions_updated_at BEFORE UPDATE ON practice_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();