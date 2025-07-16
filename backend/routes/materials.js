const express = require('express');
const Joi = require('joi');
const db = require('../config/database');
const { requireTeacher } = require('../middleware/auth');

const router = express.Router();

// Schéma de validation pour créer/modifier un matériau
const materialSchema = Joi.object({
  courseId: Joi.string().uuid().optional(),
  sessionId: Joi.string().uuid().optional(),
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().optional(),
  materialType: Joi.string().valid('video', 'pdf', 'audio', 'link', 'quiz', 'assignment', 'document').required(),
  fileUrl: Joi.string().uri().optional(),
  filePath: Joi.string().optional(),
  fileSize: Joi.number().integer().min(0).optional(),
  durationMinutes: Joi.number().integer().min(0).optional(),
  isDownloadable: Joi.boolean().optional(),
  accessLevel: Joi.string().valid('public', 'enrolled', 'premium').optional(),
  orderIndex: Joi.number().integer().min(0).optional()
});

// Récupérer les matériaux d'un cours ou d'une session
router.get('/', async (req, res, next) => {
  try {
    const { courseId, sessionId } = req.query;
    
    if (!courseId && !sessionId) {
      return res.status(400).json({ error: 'Vous devez spécifier un cours ou une session' });
    }

    let query = `
      SELECT cm.*, c.title as course_title, cs.title as session_title
      FROM course_materials cm
      LEFT JOIN courses c ON cm.course_id = c.id
      LEFT JOIN course_sessions cs ON cm.session_id = cs.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;

    if (courseId) {
      query += ` AND cm.course_id = $${paramCount}`;
      params.push(courseId);
      paramCount++;
    }

    if (sessionId) {
      query += ` AND cm.session_id = $${paramCount}`;
      params.push(sessionId);
      paramCount++;
    }

    // Si c'est un étudiant, vérifier qu'il est inscrit au cours
    if (req.user.role === 'student') {
      if (courseId) {
        query += ` AND EXISTS (
          SELECT 1 FROM enrollments e 
          WHERE e.course_id = $${paramCount} 
          AND e.student_id = $${paramCount + 1} 
          AND e.status = 'active'
        )`;
        params.push(courseId, req.user.id);
      } else if (sessionId) {
        query += ` AND EXISTS (
          SELECT 1 FROM enrollments e 
          JOIN course_sessions cs ON e.course_id = cs.course_id
          WHERE cs.id = $${paramCount} 
          AND e.student_id = $${paramCount + 1} 
          AND e.status = 'active'
        )`;
        params.push(sessionId, req.user.id);
      }
    }

    query += ` ORDER BY cm.order_index ASC, cm.created_at ASC`;

    const result = await db.query(query, params);

    res.json({
      materials: result.rows
    });

  } catch (error) {
    next(error);
  }
});

// Récupérer un matériau spécifique
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    let query = `
      SELECT cm.*, c.title as course_title, cs.title as session_title
      FROM course_materials cm
      LEFT JOIN courses c ON cm.course_id = c.id
      LEFT JOIN course_sessions cs ON cm.session_id = cs.id
      WHERE cm.id = $1
    `;

    const params = [id];

    // Si c'est un étudiant, vérifier qu'il a accès au matériau
    if (req.user.role === 'student') {
      query += ` AND (
        cm.access_level = 'public' OR
        EXISTS (
          SELECT 1 FROM enrollments e 
          WHERE e.course_id = cm.course_id 
          AND e.student_id = $2 
          AND e.status = 'active'
        )
      )`;
      params.push(req.user.id);
    }

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Matériau non trouvé' });
    }

    // Incrémenter le compteur de vues
    await db.query(
      'UPDATE course_materials SET view_count = view_count + 1 WHERE id = $1',
      [id]
    );

    res.json(result.rows[0]);

  } catch (error) {
    next(error);
  }
});

// Créer un nouveau matériau (enseignants/admins seulement)
router.post('/', requireTeacher, async (req, res, next) => {
  try {
    const { error, value } = materialSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const {
      courseId, sessionId, title, description, materialType, fileUrl,
      filePath, fileSize, durationMinutes, isDownloadable, accessLevel, orderIndex
    } = value;

    // Vérifier qu'au moins un cours ou une session est spécifié
    if (!courseId && !sessionId) {
      return res.status(400).json({ error: 'Vous devez spécifier un cours ou une session' });
    }

    // Vérifier les permissions
    if (courseId) {
      const courseResult = await db.query(
        'SELECT teacher_id FROM courses WHERE id = $1 AND is_active = true',
        [courseId]
      );

      if (courseResult.rows.length === 0) {
        return res.status(404).json({ error: 'Cours non trouvé' });
      }

      if (req.user.role !== 'admin' && courseResult.rows[0].teacher_id !== req.user.id) {
        return res.status(403).json({ error: 'Vous ne pouvez ajouter des matériaux qu\'à vos propres cours' });
      }
    }

    if (sessionId) {
      const sessionResult = await db.query(`
        SELECT c.teacher_id 
        FROM course_sessions cs
        JOIN courses c ON cs.course_id = c.id
        WHERE cs.id = $1
      `, [sessionId]);

      if (sessionResult.rows.length === 0) {
        return res.status(404).json({ error: 'Session non trouvée' });
      }

      if (req.user.role !== 'admin' && sessionResult.rows[0].teacher_id !== req.user.id) {
        return res.status(403).json({ error: 'Vous ne pouvez ajouter des matériaux qu\'à vos propres sessions' });
      }
    }

    const result = await db.query(`
      INSERT INTO course_materials (
        course_id, session_id, title, description, material_type, file_url,
        file_path, file_size, duration_minutes, is_downloadable, access_level, order_index
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      courseId, sessionId, title, description, materialType, fileUrl,
      filePath, fileSize, durationMinutes, isDownloadable || false,
      accessLevel || 'enrolled', orderIndex || 0
    ]);

    res.status(201).json({
      message: 'Matériau créé avec succès',
      material: result.rows[0]
    });

  } catch (error) {
    next(error);
  }
});

// Modifier un matériau (enseignants/admins seulement)
router.put('/:id', requireTeacher, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = materialSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Vérifier que le matériau existe et les permissions
    const materialResult = await db.query(`
      SELECT cm.*, c.teacher_id 
      FROM course_materials cm
      LEFT JOIN courses c ON cm.course_id = c.id
      WHERE cm.id = $1
    `, [id]);

    if (materialResult.rows.length === 0) {
      return res.status(404).json({ error: 'Matériau non trouvé' });
    }

    const material = materialResult.rows[0];

    if (req.user.role !== 'admin' && material.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Vous ne pouvez modifier que vos propres matériaux' });
    }

    const {
      courseId, sessionId, title, description, materialType, fileUrl,
      filePath, fileSize, durationMinutes, isDownloadable, accessLevel, orderIndex
    } = value;

    const result = await db.query(`
      UPDATE course_materials SET
        course_id = $1, session_id = $2, title = $3, description = $4,
        material_type = $5, file_url = $6, file_path = $7, file_size = $8,
        duration_minutes = $9, is_downloadable = $10, access_level = $11,
        order_index = $12, updated_at = NOW()
      WHERE id = $13
      RETURNING *
    `, [
      courseId, sessionId, title, description, materialType, fileUrl,
      filePath, fileSize, durationMinutes, isDownloadable || false,
      accessLevel || 'enrolled', orderIndex || 0, id
    ]);

    res.json({
      message: 'Matériau modifié avec succès',
      material: result.rows[0]
    });

  } catch (error) {
    next(error);
  }
});

// Supprimer un matériau (enseignants/admins seulement)
router.delete('/:id', requireTeacher, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Vérifier que le matériau existe et les permissions
    const materialResult = await db.query(`
      SELECT cm.*, c.teacher_id 
      FROM course_materials cm
      LEFT JOIN courses c ON cm.course_id = c.id
      WHERE cm.id = $1
    `, [id]);

    if (materialResult.rows.length === 0) {
      return res.status(404).json({ error: 'Matériau non trouvé' });
    }

    const material = materialResult.rows[0];

    if (req.user.role !== 'admin' && material.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Vous ne pouvez supprimer que vos propres matériaux' });
    }

    await db.query('DELETE FROM course_materials WHERE id = $1', [id]);

    res.json({ message: 'Matériau supprimé avec succès' });

  } catch (error) {
    next(error);
  }
});

module.exports = router;