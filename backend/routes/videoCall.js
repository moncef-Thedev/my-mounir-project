const express = require('express');
const Joi = require('joi');
const db = require('../config/database');
const { requireTeacher, requireStudent } = require('../middleware/auth');

const router = express.Router();

// Schéma de validation pour créer un appel vidéo
const videoCallSchema = Joi.object({
  sessionId: Joi.string().uuid().required(),
  platform: Joi.string().valid('zoom', 'google_meet', 'teams').required(),
  scheduledFor: Joi.date().optional(),
  duration: Joi.number().integer().min(15).max(480).optional(), // 15 minutes to 8 hours
  participants: Joi.array().items(Joi.string().uuid()).optional()
});

// Créer un appel vidéo (enseignants seulement)
router.post('/', requireTeacher, async (req, res, next) => {
  try {
    const { error, value } = videoCallSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { sessionId, platform, scheduledFor, duration, participants } = value;

    // Vérifier que la session existe et appartient à l'enseignant
    const sessionResult = await db.query(`
      SELECT cs.*, c.teacher_id, c.title as course_title
      FROM course_sessions cs
      JOIN courses c ON cs.course_id = c.id
      WHERE cs.id = $1
    `, [sessionId]);

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session non trouvée' });
    }

    const session = sessionResult.rows[0];

    if (req.user.role !== 'admin' && session.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Vous ne pouvez créer des appels que pour vos propres sessions' });
    }

    // Générer l'URL de l'appel selon la plateforme
    let meetingUrl = '';
    let meetingId = '';
    let meetingPassword = '';

    switch (platform) {
      case 'zoom':
        meetingId = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
        meetingUrl = `https://zoom.us/j/${meetingId}`;
        meetingPassword = Math.random().toString(36).substring(2, 8).toUpperCase();
        break;
      case 'google_meet':
        const meetCode = Math.random().toString(36).substring(2, 12);
        meetingUrl = `https://meet.google.com/${meetCode}`;
        meetingId = meetCode;
        break;
      case 'teams':
        const teamsId = Math.random().toString(36).substring(2, 15);
        meetingUrl = `https://teams.microsoft.com/l/meetup-join/${teamsId}`;
        meetingId = teamsId;
        break;
    }

    // Créer l'appel vidéo
    const result = await db.query(`
      INSERT INTO video_calls (
        session_id, created_by, platform, meeting_url, meeting_id, 
        meeting_password, scheduled_for, duration_minutes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      sessionId, req.user.id, platform, meetingUrl, meetingId,
      meetingPassword, scheduledFor || session.session_date + ' ' + session.start_time,
      duration || 90, 'scheduled'
    ]);

    // Mettre à jour la session avec l'URL de l'appel
    await db.query(`
      UPDATE course_sessions 
      SET meeting_url = $1, meeting_password = $2, updated_at = NOW()
      WHERE id = $3
    `, [meetingUrl, meetingPassword, sessionId]);

    // Notifier tous les étudiants inscrits
    const enrolledStudents = await db.query(`
      SELECT e.student_id, p.full_name, p.email
      FROM enrollments e
      JOIN profiles p ON e.student_id = p.id
      WHERE e.course_id = $1 AND e.status = 'active'
    `, [session.course_id]);

    if (enrolledStudents.rows.length > 0) {
      const notifications = enrolledStudents.rows.map(student => [
        student.student_id,
        req.user.id,
        'Appel vidéo programmé',
        `Un appel vidéo a été programmé pour la session "${session.title}" le ${new Date(scheduledFor || session.session_date + ' ' + session.start_time).toLocaleDateString('fr-FR')} à ${session.start_time}. Lien: ${meetingUrl}`,
        'course_reminder',
        session.course_id,
        sessionId
      ]);

      for (const notification of notifications) {
        await db.query(`
          INSERT INTO notifications (
            recipient_id, sender_id, title, message, notification_type, 
            related_course_id, related_session_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, notification);
      }
    }

    res.status(201).json({
      message: 'Appel vidéo créé avec succès',
      videoCall: result.rows[0],
      meetingUrl,
      meetingPassword: meetingPassword || null
    });

  } catch (error) {
    next(error);
  }
});

// Récupérer les appels vidéo d'une session
router.get('/session/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    // Vérifier l'accès à la session
    let accessQuery = `
      SELECT vc.*, cs.title as session_title, c.title as course_title,
             p.full_name as created_by_name
      FROM video_calls vc
      JOIN course_sessions cs ON vc.session_id = cs.id
      JOIN courses c ON cs.course_id = c.id
      LEFT JOIN profiles p ON vc.created_by = p.id
      WHERE vc.session_id = $1
    `;

    const params = [sessionId];

    // Si c'est un étudiant, vérifier qu'il est inscrit
    if (req.user.role === 'student') {
      accessQuery += ` AND EXISTS (
        SELECT 1 FROM enrollments e 
        WHERE e.course_id = c.id 
        AND e.student_id = $2 
        AND e.status = 'active'
      )`;
      params.push(req.user.id);
    }

    const result = await db.query(accessQuery, params);

    res.json({
      videoCalls: result.rows
    });

  } catch (error) {
    next(error);
  }
});

// Démarrer un appel vidéo
router.post('/:id/start', requireTeacher, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Vérifier que l'appel existe et appartient à l'enseignant
    const callResult = await db.query(`
      SELECT vc.*, cs.course_id, c.teacher_id
      FROM video_calls vc
      JOIN course_sessions cs ON vc.session_id = cs.id
      JOIN courses c ON cs.course_id = c.id
      WHERE vc.id = $1
    `, [id]);

    if (callResult.rows.length === 0) {
      return res.status(404).json({ error: 'Appel vidéo non trouvé' });
    }

    const call = callResult.rows[0];

    if (req.user.role !== 'admin' && call.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    // Mettre à jour le statut de l'appel
    await db.query(`
      UPDATE video_calls 
      SET status = 'in_progress', started_at = NOW(), updated_at = NOW()
      WHERE id = $1
    `, [id]);

    // Mettre à jour le statut de la session
    await db.query(`
      UPDATE course_sessions 
      SET status = 'in_progress', updated_at = NOW()
      WHERE id = $1
    `, [call.session_id]);

    res.json({
      message: 'Appel vidéo démarré',
      meetingUrl: call.meeting_url,
      meetingPassword: call.meeting_password
    });

  } catch (error) {
    next(error);
  }
});

// Terminer un appel vidéo
router.post('/:id/end', requireTeacher, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Vérifier que l'appel existe et appartient à l'enseignant
    const callResult = await db.query(`
      SELECT vc.*, cs.course_id, c.teacher_id
      FROM video_calls vc
      JOIN course_sessions cs ON vc.session_id = cs.id
      JOIN courses c ON cs.course_id = c.id
      WHERE vc.id = $1
    `, [id]);

    if (callResult.rows.length === 0) {
      return res.status(404).json({ error: 'Appel vidéo non trouvé' });
    }

    const call = callResult.rows[0];

    if (req.user.role !== 'admin' && call.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    // Calculer la durée réelle
    const actualDuration = call.started_at ? 
      Math.round((new Date() - new Date(call.started_at)) / (1000 * 60)) : 0;

    // Mettre à jour le statut de l'appel
    await db.query(`
      UPDATE video_calls 
      SET status = 'completed', ended_at = NOW(), actual_duration_minutes = $1, updated_at = NOW()
      WHERE id = $2
    `, [actualDuration, id]);

    // Mettre à jour le statut de la session
    await db.query(`
      UPDATE course_sessions 
      SET status = 'completed', updated_at = NOW()
      WHERE id = $1
    `, [call.session_id]);

    res.json({
      message: 'Appel vidéo terminé',
      actualDuration
    });

  } catch (error) {
    next(error);
  }
});

// Rejoindre un appel vidéo (étudiants)
router.get('/:id/join', requireStudent, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Vérifier que l'appel existe et que l'étudiant y a accès
    const callResult = await db.query(`
      SELECT vc.*, cs.title as session_title, c.title as course_title
      FROM video_calls vc
      JOIN course_sessions cs ON vc.session_id = cs.id
      JOIN courses c ON cs.course_id = c.id
      WHERE vc.id = $1
      AND EXISTS (
        SELECT 1 FROM enrollments e 
        WHERE e.course_id = c.id 
        AND e.student_id = $2 
        AND e.status = 'active'
      )
    `, [id, req.user.id]);

    if (callResult.rows.length === 0) {
      return res.status(404).json({ error: 'Appel vidéo non trouvé ou accès non autorisé' });
    }

    const call = callResult.rows[0];

    // Vérifier que l'appel est actif
    if (call.status !== 'in_progress' && call.status !== 'scheduled') {
      return res.status(400).json({ error: 'Cet appel vidéo n\'est pas disponible' });
    }

    // Enregistrer la participation
    await db.query(`
      INSERT INTO video_call_participants (call_id, participant_id, joined_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (call_id, participant_id) 
      DO UPDATE SET joined_at = NOW()
    `, [id, req.user.id]);

    res.json({
      message: 'Accès autorisé à l\'appel vidéo',
      meetingUrl: call.meeting_url,
      meetingPassword: call.meeting_password,
      platform: call.platform,
      sessionTitle: call.session_title,
      courseTitle: call.course_title
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;