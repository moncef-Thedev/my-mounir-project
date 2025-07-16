const express = require('express');
const Joi = require('joi');
const db = require('../config/database');
const { requireStudent, requireTeacher } = require('../middleware/auth');

const router = express.Router();

// Schéma de validation pour l'inscription
const enrollmentSchema = Joi.object({
  courseId: Joi.string().uuid().required()
});

// S'inscrire à un cours (étudiants seulement)
router.post('/', requireStudent, async (req, res, next) => {
  try {
    const { error, value } = enrollmentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { courseId } = value;
    const studentId = req.user.id;

    // Vérifier que le cours existe et est actif
    const courseResult = await db.query(
      'SELECT id, title, max_students, current_students FROM courses WHERE id = $1 AND is_active = true',
      [courseId]
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cours non trouvé' });
    }

    const course = courseResult.rows[0];

    // Vérifier si l'étudiant est déjà inscrit
    const existingEnrollment = await db.query(
      'SELECT id, status FROM enrollments WHERE student_id = $1 AND course_id = $2',
      [studentId, courseId]
    );

    if (existingEnrollment.rows.length > 0) {
      const enrollment = existingEnrollment.rows[0];
      if (enrollment.status === 'active') {
        return res.status(409).json({ error: 'Vous êtes déjà inscrit à ce cours' });
      } else if (enrollment.status === 'pending') {
        return res.status(409).json({ error: 'Votre inscription à ce cours est en attente' });
      }
    }

    // Vérifier si le cours n'est pas complet
    if (course.current_students >= course.max_students) {
      return res.status(400).json({ error: 'Ce cours est complet' });
    }

    // Créer l'inscription
    const result = await db.query(`
      INSERT INTO enrollments (student_id, course_id, status, enrollment_date)
      VALUES ($1, $2, 'active', NOW())
      RETURNING *
    `, [studentId, courseId]);

    // Créer une notification pour l'étudiant
    await db.query(`
      INSERT INTO notifications (recipient_id, title, message, notification_type, related_course_id)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      studentId,
      'Inscription confirmée',
      `Votre inscription au cours "${course.title}" a été confirmée avec succès.`,
      'enrollment',
      courseId
    ]);

    res.status(201).json({
      message: 'Inscription réussie',
      enrollment: result.rows[0]
    });

  } catch (error) {
    next(error);
  }
});

// Récupérer les inscriptions de l'utilisateur connecté
router.get('/', async (req, res, next) => {
  try {
    let query;
    let params;

    if (req.user.role === 'student') {
      // Pour les étudiants : leurs propres inscriptions
      query = `
        SELECT e.*, c.title, c.description, c.level, c.category, c.image_url,
               p.full_name as teacher_name
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        LEFT JOIN profiles p ON c.teacher_id = p.id
        WHERE e.student_id = $1
        ORDER BY e.enrollment_date DESC
      `;
      params = [req.user.id];
    } else {
      // Pour les enseignants/admins : toutes les inscriptions
      query = `
        SELECT e.*, c.title, c.description, c.level, c.category,
               s.full_name as student_name, s.email as student_email,
               t.full_name as teacher_name
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        JOIN profiles s ON e.student_id = s.id
        LEFT JOIN profiles t ON c.teacher_id = t.id
        ORDER BY e.enrollment_date DESC
      `;
      params = [];
    }

    const result = await db.query(query, params);

    res.json({
      enrollments: result.rows
    });

  } catch (error) {
    next(error);
  }
});

// Récupérer les inscriptions d'un cours spécifique (enseignants/admins)
router.get('/course/:courseId', requireTeacher, async (req, res, next) => {
  try {
    const { courseId } = req.params;

    // Vérifier que le cours existe
    const courseResult = await db.query(
      'SELECT id, teacher_id FROM courses WHERE id = $1',
      [courseId]
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cours non trouvé' });
    }

    // Vérifier les permissions (sauf admin)
    if (req.user.role !== 'admin' && courseResult.rows[0].teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const result = await db.query(`
      SELECT e.*, p.full_name, p.email, p.phone
      FROM enrollments e
      JOIN profiles p ON e.student_id = p.id
      WHERE e.course_id = $1
      ORDER BY e.enrollment_date DESC
    `, [courseId]);

    res.json({
      enrollments: result.rows
    });

  } catch (error) {
    next(error);
  }
});

// Modifier le statut d'une inscription (enseignants/admins)
router.put('/:id', requireTeacher, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validation du statut
    const validStatuses = ['pending', 'active', 'completed', 'cancelled', 'suspended'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    // Vérifier que l'inscription existe
    const enrollmentResult = await db.query(`
      SELECT e.*, c.teacher_id, c.title
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.id = $1
    `, [id]);

    if (enrollmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Inscription non trouvée' });
    }

    const enrollment = enrollmentResult.rows[0];

    // Vérifier les permissions (sauf admin)
    if (req.user.role !== 'admin' && enrollment.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    // Mettre à jour le statut
    const result = await db.query(`
      UPDATE enrollments 
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [status, id]);

    // Créer une notification pour l'étudiant
    let notificationMessage = '';
    switch (status) {
      case 'active':
        notificationMessage = `Votre inscription au cours "${enrollment.title}" a été activée.`;
        break;
      case 'suspended':
        notificationMessage = `Votre inscription au cours "${enrollment.title}" a été suspendue.`;
        break;
      case 'cancelled':
        notificationMessage = `Votre inscription au cours "${enrollment.title}" a été annulée.`;
        break;
      case 'completed':
        notificationMessage = `Félicitations ! Vous avez terminé le cours "${enrollment.title}".`;
        break;
    }

    if (notificationMessage) {
      await db.query(`
        INSERT INTO notifications (recipient_id, title, message, notification_type, related_course_id)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        enrollment.student_id,
        'Statut d\'inscription modifié',
        notificationMessage,
        'enrollment',
        enrollment.course_id
      ]);
    }

    res.json({
      message: 'Statut de l\'inscription mis à jour',
      enrollment: result.rows[0]
    });

  } catch (error) {
    next(error);
  }
});

// Annuler une inscription (étudiants)
router.delete('/:id', requireStudent, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Vérifier que l'inscription existe et appartient à l'étudiant
    const enrollmentResult = await db.query(
      'SELECT * FROM enrollments WHERE id = $1 AND student_id = $2',
      [id, req.user.id]
    );

    if (enrollmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Inscription non trouvée' });
    }

    const enrollment = enrollmentResult.rows[0];

    // Vérifier que l'inscription peut être annulée
    if (enrollment.status === 'completed') {
      return res.status(400).json({ error: 'Impossible d\'annuler une inscription terminée' });
    }

    if (enrollment.status === 'cancelled') {
      return res.status(400).json({ error: 'Cette inscription est déjà annulée' });
    }

    // Annuler l'inscription
    await db.query(
      'UPDATE enrollments SET status = $1, updated_at = NOW() WHERE id = $2',
      ['cancelled', id]
    );

    res.json({ message: 'Inscription annulée avec succès' });

  } catch (error) {
    next(error);
  }
});

module.exports = router;