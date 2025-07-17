-- Video calls table migration
-- This migration adds video call functionality to the platform

-- Table for video calls
CREATE TABLE IF NOT EXISTS video_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES course_sessions(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('zoom', 'google_meet', 'teams', 'jitsi')),
    meeting_url TEXT NOT NULL,
    meeting_id VARCHAR(255),
    meeting_password VARCHAR(100),
    scheduled_for TIMESTAMP NOT NULL,
    duration_minutes INTEGER DEFAULT 90,
    actual_duration_minutes INTEGER,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    recording_url TEXT,
    max_participants INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table for video call participants
CREATE TABLE IF NOT EXISTS video_call_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_id UUID NOT NULL REFERENCES video_calls(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMP,
    left_at TIMESTAMP,
    duration_minutes INTEGER,
    connection_quality VARCHAR(20) CHECK (connection_quality IN ('excellent', 'good', 'fair', 'poor')),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(call_id, participant_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_video_calls_session_id ON video_calls(session_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_status ON video_calls(status);
CREATE INDEX IF NOT EXISTS idx_video_calls_scheduled_for ON video_calls(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_video_call_participants_call_id ON video_call_participants(call_id);
CREATE INDEX IF NOT EXISTS idx_video_call_participants_participant_id ON video_call_participants(participant_id);

-- Trigger for updated_at
CREATE TRIGGER update_video_calls_updated_at 
    BEFORE UPDATE ON video_calls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate participation duration
CREATE OR REPLACE FUNCTION calculate_participation_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.left_at IS NOT NULL AND NEW.joined_at IS NOT NULL THEN
        NEW.duration_minutes = EXTRACT(EPOCH FROM (NEW.left_at - NEW.joined_at)) / 60;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for participation duration
CREATE TRIGGER calculate_participation_duration_trigger
    BEFORE UPDATE ON video_call_participants
    FOR EACH ROW EXECUTE FUNCTION calculate_participation_duration();