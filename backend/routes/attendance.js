const express = require('express');
const Joi = require('joi');
const db = require('../config/database');
const { requireTeacher } = require('../middleware/auth');

const router = express.Router();

// Schéma de validation pour marquer la présence
const attendanceSchema = Joi.object({
  sessionId: Joi.string().uuid().required(),
  studentId: Joi.string().uuid().required(),
  status: Joi.string().valid('present', 'absent', 'late', 'excused').required(),
  checkInTime: Joi.date().optional(),
  checkOutTime: Joi.date().optional(),
  notes: Joi.string().optional()
});

// Récupérer la présence pour une session
router.get('/session/:sessionId', requireTeacher, async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    // Vérifier que la session existe et les permissions
    const sessionResult = await db.query(`
      SELECT cs.*, c.teacher_id 
      FROM course_sessions cs
      JOIN courses c ON cs.course_id = c.id
      WHERE cs.id = $1
    `, [sessionId]);

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session non trouvée' });
    }

    const session = sessionResult.rows[0];

    if (req.user.role !== 'admin' && session.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    // Récupérer tous les étudiants inscrits au cours
    const enrolledStudents = await db.query(`
      SELECT e.student_id, p.full_name, p.email
      FROM enrollments e
      JOIN profiles p ON e.student_id = p.id
      WHERE e.course_id = $1 AND e.status = 'active'
      ORDER BY p.full_name
    `, [session.course_id]);

    // Récupérer la présence existante
    const attendanceResult = await db.query(`
      SELECT a.*, p.full_name as marked_by_name
      FROM attendance a
      LEFT JOIN profiles p ON a.marked_by = p.id
      WHERE a.session_id = $1
    `, [sessionId]);

    // Combiner les données
    const attendanceMap = {};
    attendanceResult.rows.forEach(att => {
      attendanceMap[att.student_id] = att;
    });

    const attendanceList = enrolledStudents.rows.map(student => ({
      student_id: student.student_id,
      student_name: student.full_name,
      student_email: student.email,
      attendance: attendanceMap[student.student_id] || {
        status: 'absent',
        check_in_time: null,
        check_out_time: null,
        notes: null,
        marked_by: null,
        marked_by_name: null
      }
    }));

    res.json({
      session: session,
      attendance: attendanceList
    });

  } catch (error) {
    next(error);
  }
});

// Marquer la présence d'un étudiant
router.post('/', requireTeacher, async (req, res, next) => {
  try {
    const { error, value } = attendanceSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { sessionId, studentId, status, checkInTime, checkOutTime, notes } = value;

    // Vérifier que la session existe et les permissions
    const sessionResult = await db.query(`
      SELECT cs.*, c.teacher_id 
      FROM course_sessions cs
      JOIN courses c ON cs.course_id = c.id
      WHERE cs.id = $1
    `, [sessionId]);

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session non trouvée' });
    }

    const session = sessionResult.rows[0];

    if (req.user.role !== 'admin' && session.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    // Vérifier que l'étudiant est inscrit au cours
    const enrollmentResult = await db.query(
      'SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2 AND status = $3',
      [studentId, session.course_id, 'active']
    );

    if (enrollmentResult.rows.length === 0) {
      return res.status(400).json({ error: 'L\'étudiant n\'est pas inscrit à ce cours' });
    }

    // Calculer la durée si les heures sont fournies
    let durationMinutes = null;
    if (checkInTime && checkOutTime) {
      const checkIn = new Date(checkInTime);
      const checkOut = new Date(checkOutTime);
      durationMinutes = Math.round((checkOut - checkIn) / (1000 * 60));
    }

    // Insérer ou mettre à jour la présence
    const result = await db.query(`
      INSERT INTO attendance (
        student_id, session_id, status, check_in_time, check_out_time,
        duration_minutes, notes, marked_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (student_id, session_id)
      DO UPDATE SET
        status = EXCLUDED.status,
        check_in_time = EXCLUDED.check_in_time,
        check_out_time = EXCLUDED.check_out_time,
        duration_minutes = EXCLUDED.duration_minutes,
        notes = EXCLUDED.notes,
        marked_by = EXCLUDED.marked_by,
        updated_at = NOW()
      RETURNING *
    `, [studentId, sessionId, status, checkInTime, checkOutTime, durationMinutes, notes, req.user.id]);

    res.json({
      message: 'Présence enregistrée avec succès',
      attendance: result.rows[0]
    });

  } catch (error) {
    next(error);
  }
});

// Récupérer la présence d'un étudiant
router.get('/student/:studentId', async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { courseId } = req.query;

    // Vérifier les permissions
    if (req.user.role === 'student' && req.user.id !== studentId) {
      return res.status(403).json({ error: 'Vous ne pouvez voir que votre propre présence' });
    }

    let query = `
      SELECT a.*, cs.title as session_title, cs.session_date, cs.start_time, cs.end_time,
             c.title as course_title, p.full_name as marked_by_name
      FROM attendance a
      JOIN course_sessions cs ON a.session_id = cs.id
      JOIN courses c ON cs.course_id = c.id
      LEFT JOIN profiles p ON a.marked_by = p.id
      WHERE a.student_id = $1
    `;

    const params = [studentId];

    if (courseId) {
      query += ` AND c.id = $2`;
      params.push(courseId);
    }

    // Si c'est un enseignant, ne montrer que ses cours
    if (req.user.role === 'teacher') {
      query += ` AND c.teacher_id = $${params.length + 1}`;
      params.push(req.user.id);
    }

    query += ` ORDER BY cs.session_date DESC, cs.start_time DESC`;

    const result = await db.query(query, params);

    res.json({
      attendance: result.rows
    });

  } catch (error) {
    next(error);
  }
});

// Récupérer les statistiques de présence
router.get('/stats', async (req, res, next) => {
  try {
    const { courseId, studentId } = req.query;

    let query = `
      SELECT 
        a.status,
        COUNT(*) as count
      FROM attendance a
      JOIN course_sessions cs ON a.session_id = cs.id
      JOIN courses c ON cs.course_id = c.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (courseId) {
      query += ` AND c.id = $${paramCount}`;
      params.push(courseId);
      paramCount++;
    }

    if (studentId) {
      query += ` AND a.student_id = $${paramCount}`;
      params.push(studentId);
      paramCount++;
    }

    // Vérifier les permissions
    if (req.user.role === 'student') {
      query += ` AND a.student_id = $${paramCount}`;
      params.push(req.user.id);
      paramCount++;
    } else if (req.user.role === 'teacher') {
      query += ` AND c.teacher_id = $${paramCount}`;
      params.push(req.user.id);
      paramCount++;
    }

    query += ` GROUP BY a.status`;

    const result = await db.query(query, params);

    // Calculer les pourcentages
    const total = result.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
    const stats = result.rows.map(row => ({
      status: row.status,
      count: parseInt(row.count),
      percentage: total > 0 ? Math.round((parseInt(row.count) / total) * 100) : 0
    }));

    res.json({
      stats,
      total
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;