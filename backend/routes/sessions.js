const express = require('express');
const Joi = require('joi');
const db = require('../config/database');
const { requireTeacher } = require('../middleware/auth');

const router = express.Router();

// Schéma de validation pour créer/modifier une session
const sessionSchema = Joi.object({
  courseId: Joi.string().uuid().required(),
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().optional(),
  sessionDate: Joi.date().required(),
  startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  sessionType: Joi.string().valid('online', 'in_person', 'hybrid').required(),
  location: Joi.string().optional(),
  meetingUrl: Joi.string().uri().optional(),
  meetingPassword: Joi.string().optional(),
  maxParticipants: Joi.number().integer().min(1).optional(),
  isMandatory: Joi.boolean().optional(),
  materialsRequired: Joi.array().items(Joi.string()).optional(),
  homeworkAssigned: Joi.string().optional()
});

// Récupérer toutes les sessions
router.get('/', async (req, res, next) => {
  try {
    const { courseId, upcoming, past } = req.query;
    
    let query = `
      SELECT cs.*, c.title as course_title, c.category,
             p.full_name as teacher_name
      FROM course_sessions cs
      JOIN courses c ON cs.course_id = c.id
      LEFT JOIN profiles p ON c.teacher_id = p.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;

    // Filtrer par cours si spécifié
    if (courseId) {
      query += ` AND cs.course_id = $${paramCount}`;
      params.push(courseId);
      paramCount++;
    }

    // Filtrer par date si spécifié
    if (upcoming === 'true') {
      query += ` AND (cs.session_date > CURRENT_DATE OR (cs.session_date = CURRENT_DATE AND cs.start_time > CURRENT_TIME))`;
    } else if (past === 'true') {
      query += ` AND (cs.session_date < CURRENT_DATE OR (cs.session_date = CURRENT_DATE AND cs.end_time < CURRENT_TIME))`;
    }

    // Si c'est un étudiant, ne montrer que les sessions des cours auxquels il est inscrit
    if (req.user.role === 'student') {
      query += ` AND EXISTS (
        SELECT 1 FROM enrollments e 
        WHERE e.course_id = cs.course_id 
        AND e.student_id = $${paramCount} 
        AND e.status = 'active'
      )`;
      params.push(req.user.id);
      paramCount++;
    }

    query += ` ORDER BY cs.session_date ASC, cs.start_time ASC`;

    const result = await db.query(query, params);

    res.json({
      sessions: result.rows
    });

  } catch (error) {
    next(error);
  }
});

// Récupérer une session spécifique
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    let query = `
      SELECT cs.*, c.title as course_title, c.category, c.teacher_id,
             p.full_name as teacher_name
      FROM course_sessions cs
      JOIN courses c ON cs.course_id = c.id
      LEFT JOIN profiles p ON c.teacher_id = p.id
      WHERE cs.id = $1
    `;

    const params = [id];

    // Si c'est un étudiant, vérifier qu'il est inscrit au cours
    if (req.user.role === 'student') {
      query += ` AND EXISTS (
        SELECT 1 FROM enrollments e 
        WHERE e.course_id = cs.course_id 
        AND e.student_id = $2 
        AND e.status = 'active'
      )`;
      params.push(req.user.id);
    }

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session non trouvée' });
    }

    res.json(result.rows[0]);

  } catch (error) {
    next(error);
  }
});

// Créer une nouvelle session (enseignants/admins seulement)
router.post('/', requireTeacher, async (req, res, next) => {
  try {
    const { error, value } = sessionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const {
      courseId, title, description, sessionDate, startTime, endTime,
      sessionType, location, meetingUrl, meetingPassword, maxParticipants,
      isMandatory, materialsRequired, homeworkAssigned
    } = value;

    // Vérifier que le cours existe et appartient à l'utilisateur (sauf admin)
    const courseResult = await db.query(
      'SELECT id, teacher_id, title FROM courses WHERE id = $1 AND is_active = true',
      [courseId]
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cours non trouvé' });
    }

    if (req.user.role !== 'admin' && courseResult.rows[0].teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Vous ne pouvez créer des sessions que pour vos propres cours' });
    }

    // Vérifier que l'heure de fin est après l'heure de début
    if (startTime >= endTime) {
      return res.status(400).json({ error: 'L\'heure de fin doit être après l\'heure de début' });
    }

    const result = await db.query(`
      INSERT INTO course_sessions (
        course_id, title, description, session_date, start_time, end_time,
        session_type, location, meeting_url, meeting_password, max_participants,
        is_mandatory, materials_required, homework_assigned
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [
      courseId, title, description, sessionDate, startTime, endTime,
      sessionType, location, meetingUrl, meetingPassword, maxParticipants,
      isMandatory || false, materialsRequired, homeworkAssigned
    ]);

    // Créer des notifications pour tous les étudiants inscrits au cours
    const enrolledStudents = await db.query(
      'SELECT student_id FROM enrollments WHERE course_id = $1 AND status = $2',
      [courseId, 'active']
    );

    if (enrolledStudents.rows.length > 0) {
      const notifications = enrolledStudents.rows.map(student => [
        student.student_id,
        'Nouvelle session programmée',
        `Une nouvelle session "${title}" a été programmée pour le ${sessionDate} à ${startTime}.`,
        'course_reminder',
        courseId,
        result.rows[0].id
      ]);

      for (const notification of notifications) {
        await db.query(`
          INSERT INTO notifications (recipient_id, title, message, notification_type, related_course_id, related_session_id)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, notification);
      }
    }

    res.status(201).json({
      message: 'Session créée avec succès',
      session: result.rows[0]
    });

  } catch (error) {
    next(error);
  }
});

// Modifier une session (enseignants/admins seulement)
router.put('/:id', requireTeacher, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = sessionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Vérifier que la session existe
    const sessionResult = await db.query(`
      SELECT cs.*, c.teacher_id 
      FROM course_sessions cs
      JOIN courses c ON cs.course_id = c.id
      WHERE cs.id = $1
    `, [id]);

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session non trouvée' });
    }

    const session = sessionResult.rows[0];

    // Vérifier les permissions (sauf admin)
    if (req.user.role !== 'admin' && session.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Vous ne pouvez modifier que vos propres sessions' });
    }

    const {
      courseId, title, description, sessionDate, startTime, endTime,
      sessionType, location, meetingUrl, meetingPassword, maxParticipants,
      isMandatory, materialsRequired, homeworkAssigned
    } = value;

    // Vérifier que l'heure de fin est après l'heure de début
    if (startTime >= endTime) {
      return res.status(400).json({ error: 'L\'heure de fin doit être après l\'heure de début' });
    }

    const result = await db.query(`
      UPDATE course_sessions SET
        course_id = $1, title = $2, description = $3, session_date = $4,
        start_time = $5, end_time = $6, session_type = $7, location = $8,
        meeting_url = $9, meeting_password = $10, max_participants = $11,
        is_mandatory = $12, materials_required = $13, homework_assigned = $14,
        updated_at = NOW()
      WHERE id = $15
      RETURNING *
    `, [
      courseId, title, description, sessionDate, startTime, endTime,
      sessionType, location, meetingUrl, meetingPassword, maxParticipants,
      isMandatory || false, materialsRequired, homeworkAssigned, id
    ]);

    res.json({
      message: 'Session modifiée avec succès',
      session: result.rows[0]
    });

  } catch (error) {
    next(error);
  }
});

// Supprimer une session (enseignants/admins seulement)
router.delete('/:id', requireTeacher, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Vérifier que la session existe
    const sessionResult = await db.query(`
      SELECT cs.*, c.teacher_id 
      FROM course_sessions cs
      JOIN courses c ON cs.course_id = c.id
      WHERE cs.id = $1
    `, [id]);

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session non trouvée' });
    }

    const session = sessionResult.rows[0];

    // Vérifier les permissions (sauf admin)
    if (req.user.role !== 'admin' && session.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Vous ne pouvez supprimer que vos propres sessions' });
    }

    await db.query('DELETE FROM course_sessions WHERE id = $1', [id]);

    res.json({ message: 'Session supprimée avec succès' });

  } catch (error) {
    next(error);
  }
});

module.exports = router;