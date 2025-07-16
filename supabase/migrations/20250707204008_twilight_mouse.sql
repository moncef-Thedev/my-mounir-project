-- Base de données pour la plateforme d'enseignement de Mounir Ben Yahia
-- PostgreSQL Schema avec sécurité et optimisations

-- Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table des utilisateurs (remplace auth.users de Supabase)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  email_verified boolean DEFAULT false,
  email_verification_token text,
  password_reset_token text,
  password_reset_expires timestamptz,
  last_login timestamptz,
  login_attempts integer DEFAULT 0,
  locked_until timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
  avatar_url text,
  date_of_birth date,
  address text,
  emergency_contact text,
  emergency_phone text,
  preferences jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des cours
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  level text NOT NULL CHECK (level IN ('Débutant', 'Intermédiaire', 'Avancé')),
  category text NOT NULL,
  duration_months integer NOT NULL DEFAULT 1,
  max_students integer NOT NULL DEFAULT 30,
  current_students integer DEFAULT 0,
  price decimal(10,2) DEFAULT 0,
  image_url text,
  syllabus text,
  prerequisites text,
  learning_objectives text[],
  teacher_id uuid REFERENCES profiles(id),
  is_active boolean DEFAULT true,
  start_date date,
  end_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des sessions de cours
CREATE TABLE IF NOT EXISTS course_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  session_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  session_type text NOT NULL DEFAULT 'online' CHECK (session_type IN ('online', 'in_person', 'hybrid')),
  location text,
  meeting_url text,
  meeting_password text,
  max_participants integer,
  current_participants integer DEFAULT 0,
  is_mandatory boolean DEFAULT false,
  materials_required text[],
  homework_assigned text,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  recording_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des inscriptions
CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  enrollment_date timestamptz DEFAULT now(),
  status text DEFAULT 'active' CHECK (status IN ('pending', 'active', 'completed', 'cancelled', 'suspended')),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'refunded')),
  payment_amount decimal(10,2),
  payment_date timestamptz,
  completion_percentage integer DEFAULT 0,
  final_grade text,
  certificate_issued boolean DEFAULT false,
  certificate_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, course_id)
);

-- Table des matériaux de cours
CREATE TABLE IF NOT EXISTS course_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  session_id uuid REFERENCES course_sessions(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  material_type text NOT NULL CHECK (material_type IN ('video', 'pdf', 'audio', 'link', 'quiz', 'assignment', 'document')),
  file_url text,
  file_path text,
  file_size bigint,
  duration_minutes integer,
  is_downloadable boolean DEFAULT false,
  access_level text DEFAULT 'enrolled' CHECK (access_level IN ('public', 'enrolled', 'premium')),
  order_index integer DEFAULT 0,
  view_count integer DEFAULT 0,
  download_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table de présence
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  session_id uuid REFERENCES course_sessions(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'absent' CHECK (status IN ('present', 'absent', 'late', 'excused')),
  check_in_time timestamptz,
  check_out_time timestamptz,
  duration_minutes integer,
  notes text,
  marked_by uuid REFERENCES profiles(id),
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, session_id)
);

-- Table des notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  message text NOT NULL,
  notification_type text NOT NULL CHECK (notification_type IN ('course_reminder', 'enrollment', 'assignment', 'announcement', 'system', 'payment')),
  related_course_id uuid REFERENCES courses(id) ON DELETE SET NULL,
  related_session_id uuid REFERENCES course_sessions(id) ON DELETE SET NULL,
  is_read boolean DEFAULT false,
  is_email_sent boolean DEFAULT false,
  email_sent_at timestamptz,
  scheduled_for timestamptz,
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at timestamptz DEFAULT now()
);

-- Table des messages/communications
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE SET NULL,
  subject text NOT NULL,
  content text NOT NULL,
  message_type text DEFAULT 'direct' CHECK (message_type IN ('direct', 'course_announcement', 'group')),
  is_read boolean DEFAULT false,
  read_at timestamptz,
  parent_message_id uuid REFERENCES messages(id) ON DELETE SET NULL,
  attachments jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

-- Table des évaluations et notes
CREATE TABLE IF NOT EXISTS assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  session_id uuid REFERENCES course_sessions(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  assessment_type text NOT NULL CHECK (assessment_type IN ('quiz', 'exam', 'assignment', 'project', 'participation')),
  max_score decimal(5,2) NOT NULL,
  passing_score decimal(5,2),
  due_date timestamptz,
  is_published boolean DEFAULT false,
  instructions text,
  created_by uuid REFERENCES profiles(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des résultats d'évaluation
CREATE TABLE IF NOT EXISTS assessment_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES assessments(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  score decimal(5,2),
  max_score decimal(5,2) NOT NULL,
  percentage decimal(5,2),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'graded', 'returned')),
  submission_date timestamptz,
  graded_date timestamptz,
  graded_by uuid REFERENCES profiles(id),
  feedback text,
  attempts integer DEFAULT 1,
  time_spent_minutes integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(assessment_id, student_id)
);

-- Table des logs d'activité
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  details jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_email_verification_token ON users(email_verification_token);
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);

CREATE INDEX IF NOT EXISTS idx_courses_is_active ON courses(is_active);
CREATE INDEX IF NOT EXISTS idx_courses_teacher_id ON courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_level ON courses(level);

CREATE INDEX IF NOT EXISTS idx_course_sessions_course_id ON course_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_course_sessions_date ON course_sessions(session_date, start_time);
CREATE INDEX IF NOT EXISTS idx_course_sessions_status ON course_sessions(status);

CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_course ON enrollments(student_id, course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);

CREATE INDEX IF NOT EXISTS idx_course_materials_course_id ON course_materials(course_id);
CREATE INDEX IF NOT EXISTS idx_course_materials_session_id ON course_materials(session_id);
CREATE INDEX IF NOT EXISTS idx_course_materials_order ON course_materials(course_id, order_index);

CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_session ON attendance(student_id, session_id);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_for) WHERE scheduled_for IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_course_id ON messages(course_id);

CREATE INDEX IF NOT EXISTS idx_assessments_course_id ON assessments(course_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_assessment_id ON assessment_results(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_student_id ON assessment_results(student_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);

-- Fonctions et triggers pour la mise à jour automatique
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_sessions_updated_at BEFORE UPDATE ON course_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_materials_updated_at BEFORE UPDATE ON course_materials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessment_results_updated_at BEFORE UPDATE ON assessment_results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour créer automatiquement un profil lors de l'inscription
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, 'Nouvel utilisateur', 'student');
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour créer automatiquement un profil
CREATE TRIGGER on_user_created
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Fonction pour mettre à jour le nombre d'étudiants dans un cours
CREATE OR REPLACE FUNCTION update_course_student_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE courses 
    SET current_students = (
      SELECT COUNT(*) FROM enrollments 
      WHERE course_id = NEW.course_id AND status = 'active'
    )
    WHERE id = NEW.course_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE courses 
    SET current_students = (
      SELECT COUNT(*) FROM enrollments 
      WHERE course_id = NEW.course_id AND status = 'active'
    )
    WHERE id = NEW.course_id;
    
    IF OLD.course_id != NEW.course_id THEN
      UPDATE courses 
      SET current_students = (
        SELECT COUNT(*) FROM enrollments 
        WHERE course_id = OLD.course_id AND status = 'active'
      )
      WHERE id = OLD.course_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE courses 
    SET current_students = (
      SELECT COUNT(*) FROM enrollments 
      WHERE course_id = OLD.course_id AND status = 'active'
    )
    WHERE id = OLD.course_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour le nombre d'étudiants
CREATE TRIGGER update_course_student_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION update_course_student_count();

-- Fonction pour logger les activités
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
DECLARE
  action_name text;
  resource_type_name text;
BEGIN
  -- Déterminer l'action
  IF TG_OP = 'INSERT' THEN
    action_name := 'CREATE';
  ELSIF TG_OP = 'UPDATE' THEN
    action_name := 'UPDATE';
  ELSIF TG_OP = 'DELETE' THEN
    action_name := 'DELETE';
  END IF;
  
  -- Déterminer le type de ressource
  resource_type_name := TG_TABLE_NAME;
  
  -- Insérer le log
  IF TG_OP = 'DELETE' THEN
    INSERT INTO activity_logs (action, resource_type, resource_id, details)
    VALUES (action_name, resource_type_name, OLD.id, row_to_json(OLD));
    RETURN OLD;
  ELSE
    INSERT INTO activity_logs (action, resource_type, resource_id, details)
    VALUES (action_name, resource_type_name, NEW.id, row_to_json(NEW));
    RETURN NEW;
  END IF;
END;
$$ language 'plpgsql';

-- Triggers pour logger les activités importantes
CREATE TRIGGER log_course_activity
  AFTER INSERT OR UPDATE OR DELETE ON courses
  FOR EACH ROW EXECUTE FUNCTION log_activity();

CREATE TRIGGER log_enrollment_activity
  AFTER INSERT OR UPDATE OR DELETE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION log_activity();

CREATE TRIGGER log_session_activity
  AFTER INSERT OR UPDATE OR DELETE ON course_sessions
  FOR EACH ROW EXECUTE FUNCTION log_activity();