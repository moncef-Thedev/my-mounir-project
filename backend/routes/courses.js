const express = require('express');
const Joi = require('joi');
const db = require('../config/database');
const { requireTeacher, requireStudent } = require('../middleware/auth');

const router = express.Router();

// Schéma de validation pour créer/modifier un cours
const courseSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().min(10).required(),
  level: Joi.string().valid('Débutant', 'Intermédiaire', 'Avancé').required(),
  category: Joi.string().min(2).max(100).required(),
  durationMonths: Joi.number().integer().min(1).max(24).required(),
  maxStudents: Joi.number().integer().min(1).max(1000).required(),
  price: Joi.number().min(0).optional(),
  imageUrl: Joi.string().uri().optional(),
  syllabus: Joi.string().optional(),
  prerequisites: Joi.string().optional(),
  learningObjectives: Joi.array().items(Joi.string()).optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional()
});

// Récupérer tous les cours actifs
router.get('/', async (req, res, next) => {
  try {
    const { category, level, search, page = 1, limit = 10 } = req.query;
    
    let query = `
      SELECT c.*, p.full_name as teacher_name,
             (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status = 'active') as enrolled_count
      FROM courses c
      LEFT JOIN profiles p ON c.teacher_id = p.id
      WHERE c.is_active = true
    `;
    
    const params = [];
    let paramCount = 1;

    // Filtres
    if (category) {
      query += ` AND c.category ILIKE $${paramCount}`;
      params.push(`%${category}%`);
      paramCount++;
    }

    if (level) {
      query += ` AND c.level = $${paramCount}`;
      params.push(level);
      paramCount++;
    }

    if (search) {
      query += ` AND (c.title ILIKE $${paramCount} OR c.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    // Pagination
    const offset = (page - 1) * limit;
    query += ` ORDER BY c.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Compter le total pour la pagination
    let countQuery = 'SELECT COUNT(*) FROM courses c WHERE c.is_active = true';
    const countParams = [];
    let countParamCount = 1;

    if (category) {
      countQuery += ` AND c.category ILIKE $${countParamCount}`;
      countParams.push(`%${category}%`);
      countParamCount++;
    }

    if (level) {
      countQuery += ` AND c.level = $${countParamCount}`;
      countParams.push(level);
      countParamCount++;
    }

    if (search) {
      countQuery += ` AND (c.title ILIKE $${countParamCount} OR c.description ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      courses: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    next(error);
  }
});

// Récupérer un cours spécifique
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT c.*, p.full_name as teacher_name, p.email as teacher_email,
             (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status = 'active') as enrolled_count
      FROM courses c
      LEFT JOIN profiles p ON c.teacher_id = p.id
      WHERE c.id = $1 AND c.is_active = true
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cours non trouvé' });
    }

    // Vérifier si l'utilisateur est inscrit (si c'est un étudiant)
    let isEnrolled = false;
    if (req.user.role === 'student') {
      const enrollmentResult = await db.query(
        'SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2 AND status = $3',
        [req.user.id, id, 'active']
      );
      isEnrolled = enrollmentResult.rows.length > 0;
    }

    res.json({
      ...result.rows[0],
      is_enrolled: isEnrolled
    });

  } catch (error) {
    next(error);
  }
});

// Créer un nouveau cours (enseignants/admins seulement)
router.post('/', requireTeacher, async (req, res, next) => {
  try {
    const { error, value } = courseSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const {
      title, description, level, category, durationMonths, maxStudents,
      price, imageUrl, syllabus, prerequisites, learningObjectives,
      startDate, endDate
    } = value;

    const result = await db.query(`
      INSERT INTO courses (
        title, description, level, category, duration_months, max_students,
        price, image_url, syllabus, prerequisites, learning_objectives,
        teacher_id, start_date, end_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [
      title, description, level, category, durationMonths, maxStudents,
      price || 0, imageUrl, syllabus, prerequisites, learningObjectives,
      req.user.id, startDate, endDate
    ]);

    res.status(201).json({
      message: 'Cours créé avec succès',
      course: result.rows[0]
    });

  } catch (error) {
    next(error);
  }
});

// Modifier un cours (enseignants/admins seulement)
router.put('/:id', requireTeacher, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = courseSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Vérifier que le cours existe et appartient à l'utilisateur (sauf admin)
    const courseResult = await db.query(
      'SELECT teacher_id FROM courses WHERE id = $1 AND is_active = true',
      [id]
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cours non trouvé' });
    }

    if (req.user.role !== 'admin' && courseResult.rows[0].teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Vous ne pouvez modifier que vos propres cours' });
    }

    const {
      title, description, level, category, durationMonths, maxStudents,
      price, imageUrl, syllabus, prerequisites, learningObjectives,
      startDate, endDate
    } = value;

    const result = await db.query(`
      UPDATE courses SET
        title = $1, description = $2, level = $3, category = $4,
        duration_months = $5, max_students = $6, price = $7, image_url = $8,
        syllabus = $9, prerequisites = $10, learning_objectives = $11,
        start_date = $12, end_date = $13, updated_at = NOW()
      WHERE id = $14
      RETURNING *
    `, [
      title, description, level, category, durationMonths, maxStudents,
      price || 0, imageUrl, syllabus, prerequisites, learningObjectives,
      startDate, endDate, id
    ]);

    res.json({
      message: 'Cours modifié avec succès',
      course: result.rows[0]
    });

  } catch (error) {
    next(error);
  }
});

// Supprimer un cours (désactiver)
router.delete('/:id', requireTeacher, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Vérifier que le cours existe et appartient à l'utilisateur (sauf admin)
    const courseResult = await db.query(
      'SELECT teacher_id FROM courses WHERE id = $1 AND is_active = true',
      [id]
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cours non trouvé' });
    }

    if (req.user.role !== 'admin' && courseResult.rows[0].teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Vous ne pouvez supprimer que vos propres cours' });
    }

    await db.query(
      'UPDATE courses SET is_active = false, updated_at = NOW() WHERE id = $1',
      [id]
    );

    res.json({ message: 'Cours supprimé avec succès' });

  } catch (error) {
    next(error);
  }
});

// Récupérer les statistiques d'un cours
router.get('/:id/stats', requireTeacher, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Vérifier que le cours existe et appartient à l'utilisateur (sauf admin)
    const courseResult = await db.query(
      'SELECT teacher_id FROM courses WHERE id = $1',
      [id]
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cours non trouvé' });
    }

    if (req.user.role !== 'admin' && courseResult.rows[0].teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    // Statistiques des inscriptions
    const enrollmentStats = await db.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM enrollments 
      WHERE course_id = $1 
      GROUP BY status
    `, [id]);

    // Statistiques de présence
    const attendanceStats = await db.query(`
      SELECT 
        a.status,
        COUNT(*) as count
      FROM attendance a
      JOIN course_sessions cs ON a.session_id = cs.id
      WHERE cs.course_id = $1
      GROUP BY a.status
    `, [id]);

    // Progression moyenne
    const progressStats = await db.query(`
      SELECT 
        AVG(completion_percentage) as average_progress,
        COUNT(*) as total_students
      FROM enrollments 
      WHERE course_id = $1 AND status = 'active'
    `, [id]);

    res.json({
      enrollments: enrollmentStats.rows,
      attendance: attendanceStats.rows,
      progress: progressStats.rows[0]
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;