-- Migration pour ajouter les tables d'appels vidéo

-- Table des appels vidéo
CREATE TABLE IF NOT EXISTS video_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES course_sessions(id) ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  platform text NOT NULL CHECK (platform IN ('zoom', 'google_meet', 'teams', 'jitsi')),
  meeting_url text NOT NULL,
  meeting_id text,
  meeting_password text,
  scheduled_for timestamptz NOT NULL,
  duration_minutes integer DEFAULT 90,
  actual_duration_minutes integer,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  started_at timestamptz,
  ended_at timestamptz,
  recording_url text,
  max_participants integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des participants aux appels vidéo
CREATE TABLE IF NOT EXISTS video_call_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid REFERENCES video_calls(id) ON DELETE CASCADE NOT NULL,
  participant_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at timestamptz,
  left_at timestamptz,
  duration_minutes integer,
  connection_quality text CHECK (connection_quality IN ('excellent', 'good', 'fair', 'poor')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(call_id, participant_id)
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_video_calls_session_id ON video_calls(session_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_status ON video_calls(status);
CREATE INDEX IF NOT EXISTS idx_video_calls_scheduled_for ON video_calls(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_video_call_participants_call_id ON video_call_participants(call_id);
CREATE INDEX IF NOT EXISTS idx_video_call_participants_participant_id ON video_call_participants(participant_id);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_video_calls_updated_at 
  BEFORE UPDATE ON video_calls
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour calculer automatiquement la durée de participation
CREATE OR REPLACE FUNCTION calculate_participation_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.left_at IS NOT NULL AND NEW.joined_at IS NOT NULL THEN
    NEW.duration_minutes = EXTRACT(EPOCH FROM (NEW.left_at - NEW.joined_at)) / 60;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour calculer la durée de participation
CREATE TRIGGER calculate_participation_duration_trigger
  BEFORE UPDATE ON video_call_participants
  FOR EACH ROW EXECUTE FUNCTION calculate_participation_duration();

-- Ajouter des colonnes manquantes aux tables existantes si elles n'existent pas
DO $$
BEGIN
  -- Ajouter une colonne pour les liens de réunion dans course_sessions si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'course_sessions' AND column_name = 'meeting_url'
  ) THEN
    ALTER TABLE course_sessions ADD COLUMN meeting_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'course_sessions' AND column_name = 'meeting_password'
  ) THEN
    ALTER TABLE course_sessions ADD COLUMN meeting_password text;
  END IF;

  -- Ajouter une colonne pour le statut actif des profils si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;