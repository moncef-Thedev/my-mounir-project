/*
  # Schéma complet pour la plateforme d'enseignement

  1. Nouvelles Tables
    - `profiles` - Profils utilisateurs étendus
    - `courses` - Gestion des cours
    - `course_sessions` - Sessions de cours avec dates/horaires
    - `enrollments` - Inscriptions des étudiants
    - `notifications` - Système de notifications
    - `course_materials` - Matériaux pédagogiques
    - `attendance` - Présence aux cours

  2. Sécurité
    - RLS activé sur toutes les tables
    - Politiques pour étudiants, enseignants et admin
    - Protection des données personnelles

  3. Fonctionnalités
    - Authentification complète
    - Gestion des cours et sessions
    - Système d'inscription
    - Notifications automatiques
    - Suivi de présence
*/

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
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
  price decimal(10,2) DEFAULT 0,
  image_url text,
  syllabus text,
  prerequisites text,
  learning_objectives text[],
  teacher_id uuid REFERENCES profiles(id),
  is_active boolean DEFAULT true,
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
  is_mandatory boolean DEFAULT false,
  materials_required text[],
  homework_assigned text,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
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
  notes text,
  UNIQUE(student_id, course_id)
);

-- Table des matériaux de cours
CREATE TABLE IF NOT EXISTS course_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  session_id uuid REFERENCES course_sessions(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  material_type text NOT NULL CHECK (material_type IN ('video', 'pdf', 'audio', 'link', 'quiz', 'assignment')),
  file_url text,
  file_size bigint,
  duration_minutes integer,
  is_downloadable boolean DEFAULT false,
  access_level text DEFAULT 'enrolled' CHECK (access_level IN ('public', 'enrolled', 'premium')),
  order_index integer DEFAULT 0,
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
  notes text,
  marked_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, session_id)
);

-- Table des notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  message text NOT NULL,
  notification_type text NOT NULL CHECK (notification_type IN ('course_reminder', 'enrollment', 'assignment', 'announcement', 'system')),
  related_course_id uuid REFERENCES courses(id) ON DELETE SET NULL,
  related_session_id uuid REFERENCES course_sessions(id) ON DELETE SET NULL,
  is_read boolean DEFAULT false,
  is_email_sent boolean DEFAULT false,
  scheduled_for timestamptz,
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
  parent_message_id uuid REFERENCES messages(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Activation de RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Politiques pour les profils
CREATE POLICY "Les utilisateurs peuvent voir leur propre profil"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Les admins peuvent voir tous les profils"
  ON profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- Politiques pour les cours
CREATE POLICY "Tout le monde peut voir les cours actifs"
  ON courses FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Seuls les enseignants/admins peuvent gérer les cours"
  ON courses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- Politiques pour les sessions
CREATE POLICY "Les utilisateurs peuvent voir les sessions des cours auxquels ils sont inscrits"
  ON course_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.course_id = course_sessions.course_id 
      AND e.student_id = auth.uid()
      AND e.status = 'active'
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "Seuls les enseignants/admins peuvent gérer les sessions"
  ON course_sessions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- Politiques pour les inscriptions
CREATE POLICY "Les étudiants peuvent voir leurs propres inscriptions"
  ON enrollments FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Les étudiants peuvent s'inscrire aux cours"
  ON enrollments FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Les admins/enseignants peuvent gérer toutes les inscriptions"
  ON enrollments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- Politiques pour les matériaux
CREATE POLICY "Les étudiants inscrits peuvent voir les matériaux de leurs cours"
  ON course_materials FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.course_id = course_materials.course_id 
      AND e.student_id = auth.uid()
      AND e.status = 'active'
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "Seuls les enseignants/admins peuvent gérer les matériaux"
  ON course_materials FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- Politiques pour la présence
CREATE POLICY "Les étudiants peuvent voir leur propre présence"
  ON attendance FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Les enseignants/admins peuvent gérer la présence"
  ON attendance FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- Politiques pour les notifications
CREATE POLICY "Les utilisateurs peuvent voir leurs propres notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());

CREATE POLICY "Les utilisateurs peuvent marquer leurs notifications comme lues"
  ON notifications FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid());

CREATE POLICY "Les enseignants/admins peuvent créer des notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- Politiques pour les messages
CREATE POLICY "Les utilisateurs peuvent voir leurs messages"
  ON messages FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Les utilisateurs peuvent envoyer des messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Les utilisateurs peuvent marquer leurs messages comme lus"
  ON messages FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid());

-- Fonctions et triggers pour la mise à jour automatique
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_sessions_updated_at BEFORE UPDATE ON course_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_materials_updated_at BEFORE UPDATE ON course_materials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour créer automatiquement un profil lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Nouvel utilisateur'),
    'student'
  );
  RETURN new;
END;
$$ language plpgsql security definer;

-- Trigger pour créer automatiquement un profil
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_enrollments_student_course ON enrollments(student_id, course_id);
CREATE INDEX IF NOT EXISTS idx_course_sessions_date ON course_sessions(session_date, start_time);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance(session_id, student_id);
CREATE INDEX IF NOT EXISTS idx_course_materials_course ON course_materials(course_id, order_index);

-- Insertion de données de test
INSERT INTO profiles (id, email, full_name, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'mounir@exemple.com', 'Mounir Ben Yahia', 'admin')
ON CONFLICT (id) DO NOTHING;

-- Cours de démonstration
INSERT INTO courses (id, title, description, level, category, duration_months, max_students, teacher_id) VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'Initiation au Coran',
    'Apprentissage des bases de la lecture coranique, tajwid et mémorisation de sourates courtes.',
    'Débutant',
    'Coran',
    3,
    30,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Fiqh des Adorations',
    'Jurisprudence islamique concernant les actes d''adoration : prière, jeûne, pèlerinage.',
    'Intermédiaire',
    'Fiqh',
    4,
    25,
    '00000000-0000-0000-0000-000000000001'
  )
ON CONFLICT (id) DO NOTHING;