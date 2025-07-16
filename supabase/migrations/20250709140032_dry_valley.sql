-- Plateforme d'Enseignement - Mounir Ben Yahia
-- Script d'initialisation de la base de données

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des utilisateurs (authentification)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
    avatar_url TEXT,
    date_of_birth DATE,
    address TEXT,
    emergency_contact VARCHAR(255),
    emergency_phone VARCHAR(20),
    preferences JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des cours
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    level VARCHAR(20) NOT NULL CHECK (level IN ('Débutant', 'Intermédiaire', 'Avancé')),
    category VARCHAR(100) NOT NULL,
    duration_months INTEGER NOT NULL CHECK (duration_months > 0),
    max_students INTEGER NOT NULL CHECK (max_students > 0),
    current_students INTEGER DEFAULT 0,
    price DECIMAL(10,2) DEFAULT 0,
    image_url TEXT,
    syllabus TEXT,
    prerequisites TEXT,
    learning_objectives TEXT[],
    teacher_id UUID REFERENCES profiles(id),
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des sessions de cours
CREATE TABLE IF NOT EXISTS course_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    session_type VARCHAR(20) NOT NULL CHECK (session_type IN ('online', 'in_person', 'hybrid')),
    location TEXT,
    meeting_url TEXT,
    meeting_password VARCHAR(100),
    max_participants INTEGER,
    is_mandatory BOOLEAN DEFAULT FALSE,
    materials_required TEXT[],
    homework_assigned TEXT,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des inscriptions
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrollment_date TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled', 'suspended')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'refunded')),
    payment_amount DECIMAL(10,2),
    payment_date TIMESTAMP,
    completion_percentage DECIMAL(5,2) DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    final_grade VARCHAR(10),
    certificate_issued BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, course_id)
);

-- Table des matériaux de cours
CREATE TABLE IF NOT EXISTS course_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    session_id UUID REFERENCES course_sessions(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    material_type VARCHAR(20) NOT NULL CHECK (material_type IN ('video', 'pdf', 'audio', 'link', 'quiz', 'assignment', 'document')),
    file_url TEXT,
    file_path TEXT,
    file_size BIGINT,
    duration_minutes INTEGER,
    is_downloadable BOOLEAN DEFAULT FALSE,
    access_level VARCHAR(20) DEFAULT 'enrolled' CHECK (access_level IN ('public', 'enrolled', 'premium')),
    order_index INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des évaluations
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    session_id UUID REFERENCES course_sessions(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    assessment_type VARCHAR(20) NOT NULL CHECK (assessment_type IN ('quiz', 'exam', 'assignment', 'project', 'participation')),
    max_score DECIMAL(10,2) NOT NULL CHECK (max_score > 0),
    passing_score DECIMAL(10,2),
    due_date TIMESTAMP,
    is_published BOOLEAN DEFAULT FALSE,
    instructions TEXT,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des résultats d'évaluations
CREATE TABLE IF NOT EXISTS assessment_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    score DECIMAL(10,2),
    max_score DECIMAL(10,2) NOT NULL,
    percentage DECIMAL(5,2),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'graded', 'late')),
    submission_date TIMESTAMP,
    graded_date TIMESTAMP,
    graded_by UUID REFERENCES profiles(id),
    feedback TEXT,
    attempts INTEGER DEFAULT 1,
    time_spent_minutes INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(assessment_id, student_id)
);

-- Table de présence
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES course_sessions(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    duration_minutes INTEGER,
    notes TEXT,
    marked_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, session_id)
);

-- Table des notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(30) NOT NULL CHECK (notification_type IN ('course_reminder', 'enrollment', 'assignment', 'announcement', 'system')),
    related_course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    related_session_id UUID REFERENCES course_sessions(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT FALSE,
    is_email_sent BOOLEAN DEFAULT FALSE,
    priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    scheduled_for TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table des messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    subject VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'direct' CHECK (message_type IN ('direct', 'course_announcement', 'group')),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    parent_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_courses_teacher ON courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_courses_active ON courses(is_active);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_sessions_course ON course_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON course_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);

-- Triggers pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON course_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON course_materials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_results_updated_at BEFORE UPDATE ON assessment_results FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();