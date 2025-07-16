-- Données d'exemple pour la plateforme d'enseignement

-- Insérer un utilisateur administrateur
INSERT INTO users (id, email, password_hash, email_verified) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'mounir@exemple.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qK', true)
ON CONFLICT (email) DO NOTHING;

-- Insérer le profil administrateur
INSERT INTO profiles (id, email, full_name, role, is_active) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'mounir@exemple.com', 'Mounir Ben Yahia', 'admin', true)
ON CONFLICT (id) DO NOTHING;

-- Insérer quelques utilisateurs étudiants de test
INSERT INTO users (id, email, password_hash, email_verified) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'etudiant1@exemple.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qK', true),
('550e8400-e29b-41d4-a716-446655440002', 'etudiant2@exemple.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qK', true),
('550e8400-e29b-41d4-a716-446655440003', 'enseignant@exemple.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qK', true)
ON CONFLICT (email) DO NOTHING;

-- Insérer les profils correspondants
INSERT INTO profiles (id, email, full_name, role, is_active) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'etudiant1@exemple.com', 'Ahmed Benali', 'student', true),
('550e8400-e29b-41d4-a716-446655440002', 'etudiant2@exemple.com', 'Fatima Zahra', 'student', true),
('550e8400-e29b-41d4-a716-446655440003', 'enseignant@exemple.com', 'Omar Al-Fiqhi', 'teacher', true)
ON CONFLICT (id) DO NOTHING;

-- Insérer quelques cours d'exemple
INSERT INTO courses (id, title, description, level, category, duration_months, max_students, teacher_id, is_active) VALUES 
('650e8400-e29b-41d4-a716-446655440000', 'Initiation au Coran', 'Apprentissage des bases de la lecture coranique et du Tajwid', 'Débutant', 'Coran et Tajwid', 3, 25, '550e8400-e29b-41d4-a716-446655440000', true),
('650e8400-e29b-41d4-a716-446655440001', 'Fiqh des Adorations', 'Étude approfondie des règles de la prière, du jeûne et du pèlerinage', 'Intermédiaire', 'Jurisprudence', 6, 20, '550e8400-e29b-41d4-a716-446655440000', true),
('650e8400-e29b-41d4-a716-446655440002', 'Tafsir du Coran', 'Exégèse des sourates principales du Coran', 'Avancé', 'Sciences Coraniques', 12, 15, '550e8400-e29b-41d4-a716-446655440000', true),
('650e8400-e29b-41d4-a716-446655440003', 'Langue Arabe Coranique', 'Apprentissage de la grammaire arabe pour comprendre le Coran', 'Débutant', 'Langue Arabe', 8, 30, '550e8400-e29b-41d4-a716-446655440003', true),
('650e8400-e29b-41d4-a716-446655440004', 'Hadith et Sciences du Hadith', 'Étude des traditions prophétiques et de leur authentification', 'Intermédiaire', 'Hadith', 9, 18, '550e8400-e29b-41d4-a716-446655440000', true)
ON CONFLICT (id) DO NOTHING;

-- Insérer quelques sessions d'exemple
INSERT INTO course_sessions (id, course_id, title, description, session_date, start_time, end_time, session_type, meeting_url, is_mandatory) VALUES 
('750e8400-e29b-41d4-a716-446655440000', '650e8400-e29b-41d4-a716-446655440000', 'Introduction au Tajwid', 'Première leçon sur les règles de base du Tajwid', '2025-01-15', '19:00', '20:30', 'online', 'https://meet.google.com/abc-defg-hij', true),
('750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 'Les conditions de la prière', 'Étude des conditions de validité de la prière', '2025-01-16', '20:00', '21:30', 'online', 'https://zoom.us/j/123456789', true),
('750e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440002', 'Tafsir de Sourate Al-Fatiha', 'Exégèse détaillée de la sourate d\'ouverture', '2025-01-18', '19:30', '21:00', 'online', 'https://meet.google.com/xyz-uvwx-yz', false),
('750e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440003', 'Les verbes en arabe', 'Introduction aux verbes trilitères', '2025-01-20', '18:00', '19:30', 'online', 'https://zoom.us/j/987654321', true),
('750e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440004', 'Classification des Hadiths', 'Les différents types de Hadiths selon leur authenticité', '2025-01-22', '20:30', '22:00', 'online', 'https://meet.google.com/hadith-class', false)
ON CONFLICT (id) DO NOTHING;

-- Insérer quelques inscriptions d'exemple
INSERT INTO enrollments (student_id, course_id, status, enrollment_date) VALUES 
('550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440000', 'active', NOW() - INTERVAL '5 days'),
('550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440003', 'active', NOW() - INTERVAL '3 days'),
('550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440000', 'active', NOW() - INTERVAL '2 days'),
('550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440001', 'active', NOW() - INTERVAL '1 day')
ON CONFLICT (student_id, course_id) DO NOTHING;

-- Insérer quelques notifications d'exemple
INSERT INTO notifications (recipient_id, title, message, notification_type, related_course_id) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'Bienvenue !', 'Bienvenue sur la plateforme d\'enseignement de Mounir Ben Yahia', 'system', NULL),
('550e8400-e29b-41d4-a716-446655440001', 'Nouvelle session programmée', 'Une nouvelle session "Introduction au Tajwid" a été programmée pour le 15 janvier à 19h00', 'course_reminder', '650e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440002', 'Inscription confirmée', 'Votre inscription au cours "Initiation au Coran" a été confirmée', 'enrollment', '650e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440002', 'Rappel de session', 'N\'oubliez pas la session "Les conditions de la prière" demain à 20h00', 'course_reminder', '650e8400-e29b-41d4-a716-446655440001')
ON CONFLICT DO NOTHING;

-- Mettre à jour le compteur d'étudiants pour les cours
UPDATE courses SET current_students = (
    SELECT COUNT(*) FROM enrollments 
    WHERE enrollments.course_id = courses.id 
    AND enrollments.status = 'active'
);

-- Afficher un message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Base de données initialisée avec succès !';
    RAISE NOTICE 'Compte administrateur: mounir@exemple.com / password123';
    RAISE NOTICE 'Comptes étudiants: etudiant1@exemple.com, etudiant2@exemple.com / password123';
    RAISE NOTICE 'Compte enseignant: enseignant@exemple.com / password123';
END $$;