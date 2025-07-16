const express = require('express');
const Joi = require('joi');
const db = require('../config/database');
const { requireTeacher, requireStudent } = require('../middleware/auth');

const router = express.Router();

// Schéma de validation pour créer/modifier une évaluation
const assessmentSchema = Joi.object({
  courseId: Joi.string().uuid().required(),
  sessionId: Joi.string().uuid().optional(),
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().optional(),
  assessmentType: Joi.string().valid('quiz', 'exam', 'assignment', 'project', 'participation').required(),
  maxScore: Joi.number().min(0).required(),
  passingScore: Joi.number().min(0).optional(),
  dueDate: Joi.date().optional(),
  isPublished: Joi.boolean().optional(),
  instructions: Joi.string().optional()
});

// Schéma de validation pour soumettre un résultat
const resultSchema = Joi.object({
  score: Joi.number().min(0).optional(),
  timeSpentMinutes: Joi.number().integer().min(0).optional(),
  answers: Joi.object().optional()
});

// Récupérer les évaluations d'un cours
router.get('/', async (req, res, next) => {
  try {
    const { courseId } = req.query;
    
    if (!courseId) {
      return res.status(400).json({ error: 'L\'ID du cours est requis' });
    }

    let query = `
      SELECT a.*, c.title as course_title, cs.title as session_title,
             p.full_name as created_by_name
      FROM assessments a
      JOIN courses c ON a.course_id = c.id
      LEFT JOIN course_sessions cs ON a.session_id = cs.id
      LEFT JOIN profiles p ON a.created_by = p.id
      WHERE a.course_id = $1
    `;
    
    const params = [courseId];

    // Si c'est un étudiant, ne montrer que les évaluations publiées et vérifier l'inscription
    if (req.user.role === 'student') {
      query += ` AND a.is_published = true AND EXISTS (
        SELECT 1 FROM enrollments e 
        WHERE e.course_id = $1 
        AND e.student_id = $2 
        AND e.status = 'active'
      )`;
      params.push(req.user.id);
    }

    query += ` ORDER BY a.due_date ASC, a.created_at DESC`;

    const result = await db.query(query, params);

    // Si c'est un étudiant, ajouter les résultats
    if (req.user.role === 'student') {
      for (let assessment of result.rows) {
        const resultQuery = await db.query(
          'SELECT * FROM assessment_results WHERE assessment_id = $1 AND student_id = $2',
          [assessment.id, req.user.id]
        );
        assessment.student_result = resultQuery.rows[0] || null;
      }
    }

    res.json({
      assessments: result.rows
    });

  } catch (error) {
    next(error);
  }
});

// Récupérer une évaluation spécifique
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    let query = `
      SELECT a.*, c.title as course_title, cs.title as session_title,
             p.full_name as created_by_name
      FROM assessments a
      JOIN courses c ON a.course_id = c.id
      LEFT JOIN course_sessions cs ON a.session_id = cs.id
      LEFT JOIN profiles p ON a.created_by = p.id
      WHERE a.id = $1
    `;

    const params = [id];

    // Si c'est un étudiant, vérifier l'accès
    if (req.user.role === 'student') {
      query += ` AND a.is_published = true AND EXISTS (
        SELECT 1 FROM enrollments e 
        WHERE e.course_id = a.course_id 
        AND e.student_id = $2 
        AND e.status = 'active'
      )`;
      params.push(req.user.id);
    }

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Évaluation non trouvée' });
    }

    const assessment = result.rows[0];

    // Si c'est un étudiant, ajouter son résultat
    if (req.user.role === 'student') {
      const resultQuery = await db.query(
        'SELECT * FROM assessment_results WHERE assessment_id = $1 AND student_id = $2',
        [id, req.user.id]
      );
      assessment.student_result = resultQuery.rows[0] || null;
    }

    res.json(assessment);

  } catch (error) {
    next(error);
  }
});

// Créer une nouvelle évaluation (enseignants/admins seulement)
router.post('/', requireTeacher, async (req, res, next) => {
  try {
    const { error, value } = assessmentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const {
      courseId, sessionId, title, description, assessmentType, maxScore,
      passingScore, dueDate, isPublished, instructions
    } = value;

    // Vérifier que le cours existe et appartient à l'utilisateur (sauf admin)
    const courseResult = await db.query(
      'SELECT teacher_id FROM courses WHERE id = $1 AND is_active = true',
      [courseId]
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cours non trouvé' });
    }

    if (req.user.role !== 'admin' && courseResult.rows[0].teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Vous ne pouvez créer des évaluations que pour vos propres cours' });
    }

    const result = await db.query(`
      INSERT INTO assessments (
        course_id, session_id, title, description, assessment_type, max_score,
        passing_score, due_date, is_published, instructions, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      courseId, sessionId, title, description, assessmentType, maxScore,
      passingScore, dueDate, isPublished || false, instructions, req.user.id
    ]);

    res.status(201).json({
      message: 'Évaluation créée avec succès',
      assessment: result.rows[0]
    });

  } catch (error) {
    next(error);
  }
});

// Soumettre un résultat d'évaluation (étudiants)
router.post('/:id/submit', requireStudent, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = resultSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { score, timeSpentMinutes, answers } = value;

    // Vérifier que l'évaluation existe et est accessible
    const assessmentResult = await db.query(`
      SELECT a.*, c.teacher_id 
      FROM assessments a
      JOIN courses c ON a.course_id = c.id
      WHERE a.id = $1 AND a.is_published = true
      AND EXISTS (
        SELECT 1 FROM enrollments e 
        WHERE e.course_id = a.course_id 
        AND e.student_id = $2 
        AND e.status = 'active'
      )
    `, [id, req.user.id]);

    if (assessmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Évaluation non trouvée ou non accessible' });
    }

    const assessment = assessmentResult.rows[0];

    // Vérifier si l'étudiant a déjà soumis
    const existingResult = await db.query(
      'SELECT id, attempts FROM assessment_results WHERE assessment_id = $1 AND student_id = $2',
      [id, req.user.id]
    );

    let result;
    if (existingResult.rows.length > 0) {
      // Mettre à jour le résultat existant
      const attempts = existingResult.rows[0].attempts + 1;
      const percentage = score ? (score / assessment.max_score) * 100 : null;
      
      result = await db.query(`
        UPDATE assessment_results SET
          score = $1, max_score = $2, percentage = $3, status = $4,
          submission_date = NOW(), attempts = $5, time_spent_minutes = $6,
          updated_at = NOW()
        WHERE id = $7
        RETURNING *
      `, [score, assessment.max_score, percentage, 'submitted', attempts, timeSpentMinutes, existingResult.rows[0].id]);
    } else {
      // Créer un nouveau résultat
      const percentage = score ? (score / assessment.max_score) * 100 : null;
      
      result = await db.query(`
        INSERT INTO assessment_results (
          assessment_id, student_id, score, max_score, percentage, status,
          submission_date, attempts, time_spent_minutes
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8)
        RETURNING *
      `, [id, req.user.id, score, assessment.max_score, percentage, 'submitted', 1, timeSpentMinutes]);
    }

    res.json({
      message: 'Résultat soumis avec succès',
      result: result.rows[0]
    });

  } catch (error) {
    next(error);
  }
});

// Récupérer les résultats d'une évaluation (enseignants/admins)
router.get('/:id/results', requireTeacher, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Vérifier que l'évaluation existe et les permissions
    const assessmentResult = await db.query(`
      SELECT a.*, c.teacher_id 
      FROM assessments a
      JOIN courses c ON a.course_id = c.id
      WHERE a.id = $1
    `, [id]);

    if (assessmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Évaluation non trouvée' });
    }

    const assessment = assessmentResult.rows[0];

    if (req.user.role !== 'admin' && assessment.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const results = await db.query(`
      SELECT ar.*, p.full_name, p.email
      FROM assessment_results ar
      JOIN profiles p ON ar.student_id = p.id
      WHERE ar.assessment_id = $1
      ORDER BY ar.submission_date DESC
    `, [id]);

    res.json({
      results: results.rows
    });

  } catch (error) {
    next(error);
  }
});

// Noter un résultat (enseignants/admins)
router.put('/results/:resultId/grade', requireTeacher, async (req, res, next) => {
  try {
    const { resultId } = req.params;
    const { score, feedback } = req.body;

    if (typeof score !== 'number' || score < 0) {
      return res.status(400).json({ error: 'Score invalide' });
    }

    // Vérifier que le résultat existe et les permissions
    const resultQuery = await db.query(`
      SELECT ar.*, a.max_score, c.teacher_id 
      FROM assessment_results ar
      JOIN assessments a ON ar.assessment_id = a.id
      JOIN courses c ON a.course_id = c.id
      WHERE ar.id = $1
    `, [resultId]);

    if (resultQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Résultat non trouvé' });
    }

    const resultData = resultQuery.rows[0];

    if (req.user.role !== 'admin' && resultData.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    if (score > resultData.max_score) {
      return res.status(400).json({ error: 'Le score ne peut pas dépasser le score maximum' });
    }

    const percentage = (score / resultData.max_score) * 100;

    const result = await db.query(`
      UPDATE assessment_results SET
        score = $1, percentage = $2, status = $3, graded_date = NOW(),
        graded_by = $4, feedback = $5, updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `, [score, percentage, 'graded', req.user.id, feedback, resultId]);

    res.json({
      message: 'Résultat noté avec succès',
      result: result.rows[0]
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;