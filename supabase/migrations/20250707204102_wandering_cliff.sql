-- Données de test pour la plateforme d'enseignement

-- Utilisateur administrateur (Mounir Ben Yahia)
INSERT INTO users (id, email, password_hash, email_verified) VALUES
  ('00000000-0000-0000-0000-000000000001', 'mounir@exemple.com', '$2b$12$LQv3c1yqBwEHxv68UVFWmu5xSMNvHx9DOKZVzXbzLABfurxHexHWu', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, email, full_name, role, phone, address) VALUES
  ('00000000-0000-0000-0000-000000000001', 'mounir@exemple.com', 'Mounir Ben Yahia', 'admin', '+33123456789', '123 Rue de l''Éducation, 75001 Paris')
ON CONFLICT (id) DO NOTHING;

-- Utilisateurs étudiants de test
INSERT INTO users (id, email, password_hash, email_verified) VALUES
  ('11111111-1111-1111-1111-111111111111', 'ahmed@exemple.com', '$2b$12$LQv3c1yqBwEHxv68UVFWmu5xSMNvHx9DOKZVzXbzLABfurxHexHWu', true),
  ('22222222-2222-2222-2222-222222222222', 'fatima@exemple.com', '$2b$12$LQv3c1yqBwEHxv68UVFWmu5xSMNvHx9DOKZVzXbzLABfurxHexHWu', true),
  ('33333333-3333-3333-3333-333333333333', 'omar@exemple.com', '$2b$12$LQv3c1yqBwEHxv68UVFWmu5xSMNvHx9DOKZVzXbzLABfurxHexHWu', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, email, full_name, role, phone) VALUES
  ('11111111-1111-1111-1111-111111111111', 'ahmed@exemple.com', 'Ahmed Benali', 'student', '+33123456790'),
  ('22222222-2222-2222-2222-222222222222', 'fatima@exemple.com', 'Fatima Zahra', 'student', '+33123456791'),
  ('33333333-3333-3333-3333-333333333333', 'omar@exemple.com', 'Omar Khayyam', 'student', '+33123456792')
ON CONFLICT (id) DO NOTHING;

-- Cours de démonstration
INSERT INTO courses (id, title, description, level, category, duration_months, max_students, price, teacher_id, start_date, end_date) VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Initiation au Coran',
    'Apprentissage des bases de la lecture coranique, tajwid et mémorisation de sourates courtes. Ce cours s''adresse aux débutants souhaitant découvrir la beauté de la récitation coranique.',
    'Débutant',
    'Coran',
    3,
    30,
    150.00,
    '00000000-0000-0000-0000-000000000001',
    '2025-02-01',
    '2025-05-01'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Fiqh des Adorations',
    'Jurisprudence islamique concernant les actes d''adoration : prière, jeûne, pèlerinage. Étude approfondie des règles et conditions de validité.',
    'Intermédiaire',
    'Fiqh',
    4,
    25,
    200.00,
    '00000000-0000-0000-0000-000000000001',
    '2025-02-15',
    '2025-06-15'
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Études de la Sira',
    'Étude approfondie de la biographie du Prophète Muhammad (paix et salut sur lui). Analyse des événements marquants et des enseignements.',
    'Intermédiaire',
    'Sira',
    6,
    20,
    300.00,
    '00000000-0000-0000-0000-000000000001',
    '2025-03-01',
    '2025-09-01'
  ),
  (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'Langue Arabe Coranique',
    'Apprentissage de l''arabe spécifiquement pour comprendre le Coran et les textes religieux. Grammaire, vocabulaire et syntaxe.',
    'Débutant',
    'Langue',
    6,
    35,
    250.00,
    '00000000-0000-0000-0000-000000000001',
    '2025-02-01',
    '2025-08-01'
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'Tafsir du Coran',
    'Exégèse et interprétation des versets coraniques selon les grandes écoles d''interprétation. Niveau avancé.',
    'Avancé',
    'Tafsir',
    12,
    15,
    500.00,
    '00000000-0000-0000-0000-000000000001',
    '2025-03-15',
    '2026-03-15'
  )
ON CONFLICT (id) DO NOTHING;

-- Sessions de cours programmées
INSERT INTO course_sessions (id, course_id, title, description, session_date, start_time, end_time, session_type, meeting_url, max_participants) VALUES
  (
    'session1-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Introduction au Tajwid',
    'Première session : les règles de base de la récitation coranique',
    '2025-01-20',
    '19:00',
    '20:30',
    'online',
    'https://meet.google.com/abc-defg-hij',
    30
  ),
  (
    'session2-2222-2222-2222-222222222222',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Les lettres et leurs points d''articulation',
    'Deuxième session : étude détaillée de la phonétique arabe',
    '2025-01-22',
    '19:00',
    '20:30',
    'online',
    'https://meet.google.com/abc-defg-hij',
    30
  ),
  (
    'session3-3333-3333-3333-333333333333',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Les conditions de la prière',
    'Étude des conditions préalables à l''accomplissement de la prière',
    '2025-01-25',
    '20:00',
    '21:30',
    'online',
    'https://meet.google.com/xyz-uvwx-yz',
    25
  ),
  (
    'session4-4444-4444-4444-444444444444',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'L''alphabet arabe',
    'Première leçon : découverte de l''alphabet et de l''écriture arabe',
    '2025-01-18',
    '18:30',
    '20:00',
    'hybrid',
    'https://meet.google.com/def-ghij-klm',
    35
  )
ON CONFLICT (id) DO NOTHING;

-- Inscriptions de test
INSERT INTO enrollments (id, student_id, course_id, status, payment_status, payment_amount, payment_date) VALUES
  (
    'enroll11-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'active',
    'paid',
    150.00,
    '2025-01-10'
  ),
  (
    'enroll22-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'active',
    'paid',
    150.00,
    '2025-01-12'
  ),
  (
    'enroll33-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'active',
    'paid',
    250.00,
    '2025-01-15'
  ),
  (
    'enroll44-4444-4444-4444-444444444444',
    '11111111-1111-1111-1111-111111111111',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'pending',
    'pending',
    NULL,
    NULL
  )
ON CONFLICT (id) DO NOTHING;

-- Matériaux de cours
INSERT INTO course_materials (id, course_id, title, description, material_type, file_url, is_downloadable, access_level, order_index) VALUES
  (
    'material1-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Guide du Tajwid - PDF',
    'Manuel complet des règles de récitation coranique',
    'pdf',
    '/materials/tajwid-guide.pdf',
    true,
    'enrolled',
    1
  ),
  (
    'material2-2222-2222-2222-222222222222',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Récitation modèle - Audio',
    'Exemples de récitation par un qari expérimenté',
    'audio',
    '/materials/recitation-examples.mp3',
    true,
    'enrolled',
    2
  ),
  (
    'material3-3333-3333-3333-333333333333',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'Alphabet arabe interactif',
    'Application interactive pour apprendre l''alphabet',
    'link',
    'https://arabic-alphabet.example.com',
    false,
    'enrolled',
    1
  )
ON CONFLICT (id) DO NOTHING;

-- Notifications de test
INSERT INTO notifications (id, recipient_id, sender_id, title, message, notification_type, related_course_id, priority) VALUES
  (
    'notif111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000001',
    'Bienvenue dans le cours d''Initiation au Coran',
    'Félicitations ! Votre inscription au cours d''Initiation au Coran a été confirmée. Le cours commence le 20 janvier 2025.',
    'enrollment',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'normal'
  ),
  (
    'notif222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000001',
    'Rappel : Session demain',
    'N''oubliez pas votre session "Introduction au Tajwid" demain à 19h00.',
    'course_reminder',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'high'
  ),
  (
    'notif333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333',
    '00000000-0000-0000-0000-000000000001',
    'Nouveau matériel disponible',
    'Un nouveau guide PDF a été ajouté à votre cours de Langue Arabe.',
    'announcement',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'normal'
  )
ON CONFLICT (id) DO NOTHING;

-- Évaluations de test
INSERT INTO assessments (id, course_id, title, description, assessment_type, max_score, passing_score, due_date, is_published, created_by) VALUES
  (
    'assess11-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Quiz Tajwid - Règles de base',
    'Évaluation des connaissances de base en Tajwid',
    'quiz',
    20.00,
    14.00,
    '2025-01-30 23:59:00',
    true,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'assess22-2222-2222-2222-222222222222',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Examen Fiqh - Prière',
    'Examen sur les règles de la prière en Islam',
    'exam',
    100.00,
    70.00,
    '2025-02-15 18:00:00',
    true,
    '00000000-0000-0000-0000-000000000001'
  )
ON CONFLICT (id) DO NOTHING;

-- Résultats d'évaluation
INSERT INTO assessment_results (id, assessment_id, student_id, score, max_score, percentage, status, submission_date, graded_date, graded_by, feedback) VALUES
  (
    'result11-1111-1111-1111-111111111111',
    'assess11-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    18.00,
    20.00,
    90.00,
    'graded',
    '2025-01-28 20:30:00',
    '2025-01-29 10:00:00',
    '00000000-0000-0000-0000-000000000001',
    'Excellent travail ! Vous maîtrisez bien les règles de base.'
  ),
  (
    'result22-2222-2222-2222-222222222222',
    'assess11-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    16.00,
    20.00,
    80.00,
    'graded',
    '2025-01-29 19:45:00',
    '2025-01-30 09:30:00',
    '00000000-0000-0000-0000-000000000001',
    'Très bon résultat. Continuez vos efforts !'
  )
ON CONFLICT (id) DO NOTHING;

-- Messages de test
INSERT INTO messages (id, sender_id, recipient_id, course_id, subject, content, message_type) VALUES
  (
    'message1-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Félicitations pour votre progression',
    'Bonjour Ahmed, je tenais à vous féliciter pour votre excellent travail dans le cours d''Initiation au Coran. Continuez ainsi !',
    'direct'
  ),
  (
    'message2-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000001',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Question sur le Tajwid',
    'Assalamu alaikum Ustadh, j''ai une question concernant la règle du Qalqala. Pourriez-vous m''expliquer plus en détail ?',
    'direct'
  )
ON CONFLICT (id) DO NOTHING;

-- Présences de test
INSERT INTO attendance (id, student_id, session_id, status, check_in_time, check_out_time, duration_minutes, marked_by) VALUES
  (
    'attend11-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'session1-1111-1111-1111-111111111111',
    'present',
    '2025-01-20 19:00:00',
    '2025-01-20 20:30:00',
    90,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'attend22-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    'session1-1111-1111-1111-111111111111',
    'present',
    '2025-01-20 19:05:00',
    '2025-01-20 20:30:00',
    85,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'attend33-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333',
    'session4-4444-4444-4444-444444444444',
    'late',
    '2025-01-18 18:45:00',
    '2025-01-18 20:00:00',
    75,
    '00000000-0000-0000-0000-000000000001'
  )
ON CONFLICT (id) DO NOTHING;