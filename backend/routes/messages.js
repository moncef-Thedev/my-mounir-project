const express = require('express');
const Joi = require('joi');
const db = require('../config/database');

const router = express.Router();

// Schéma de validation pour créer un message
const messageSchema = Joi.object({
  recipientId: Joi.string().uuid().optional(),
  courseId: Joi.string().uuid().optional(),
  subject: Joi.string().min(3).max(200).required(),
  content: Joi.string().min(10).required(),
  messageType: Joi.string().valid('direct', 'course_announcement', 'group').optional(),
  parentMessageId: Joi.string().uuid().optional()
});

// Récupérer les messages de l'utilisateur
router.get('/', async (req, res, next) => {
  try {
    const { type = 'all', limit = 50 } = req.query;
    
    let query = `
      SELECT m.*, 
             s.full_name as sender_name, s.email as sender_email,
             r.full_name as recipient_name, r.email as recipient_email,
             c.title as course_title
      FROM messages m
      LEFT JOIN profiles s ON m.sender_id = s.id
      LEFT JOIN profiles r ON m.recipient_id = r.id
      LEFT JOIN courses c ON m.course_id = c.id
      WHERE (m.sender_id = $1 OR m.recipient_id = $1)
    `;
    
    const params = [req.user.id];

    if (type === 'sent') {
      query += ` AND m.sender_id = $1`;
    } else if (type === 'received') {
      query += ` AND m.recipient_id = $1`;
    }

    query += ` ORDER BY m.created_at DESC LIMIT $2`;
    params.push(parseInt(limit));

    const result = await db.query(query, params);

    res.json({
      messages: result.rows
    });

  } catch (error) {
    next(error);
  }
});

// Récupérer un message spécifique
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT m.*, 
             s.full_name as sender_name, s.email as sender_email,
             r.full_name as recipient_name, r.email as recipient_email,
             c.title as course_title
      FROM messages m
      LEFT JOIN profiles s ON m.sender_id = s.id
      LEFT JOIN profiles r ON m.recipient_id = r.id
      LEFT JOIN courses c ON m.course_id = c.id
      WHERE m.id = $1 AND (m.sender_id = $2 OR m.recipient_id = $2)
    `, [id, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message non trouvé' });
    }

    const message = result.rows[0];

    // Marquer comme lu si c'est le destinataire
    if (message.recipient_id === req.user.id && !message.is_read) {
      await db.query(
        'UPDATE messages SET is_read = true, read_at = NOW() WHERE id = $1',
        [id]
      );
      message.is_read = true;
      message.read_at = new Date();
    }

    // Récupérer les réponses
    const repliesResult = await db.query(`
      SELECT m.*, 
             s.full_name as sender_name, s.email as sender_email
      FROM messages m
      LEFT JOIN profiles s ON m.sender_id = s.id
      WHERE m.parent_message_id = $1
      ORDER BY m.created_at ASC
    `, [id]);

    message.replies = repliesResult.rows;

    res.json(message);

  } catch (error) {
    next(error);
  }
});

// Envoyer un nouveau message
router.post('/', async (req, res, next) => {
  try {
    const { error, value } = messageSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const {
      recipientId, courseId, subject, content, messageType, parentMessageId
    } = value;

    // Vérifier qu'au moins un destinataire est spécifié
    if (!recipientId && !courseId) {
      return res.status(400).json({ error: 'Vous devez spécifier un destinataire ou un cours' });
    }

    let recipients = [];

    if (recipientId) {
      // Message direct
      recipients = [recipientId];
    } else if (courseId) {
      // Message à tous les étudiants d'un cours (enseignants/admins seulement)
      if (!['admin', 'teacher'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Seuls les enseignants peuvent envoyer des messages de cours' });
      }

      // Vérifier que le cours appartient à l'enseignant (sauf admin)
      if (req.user.role === 'teacher') {
        const courseResult = await db.query(
          'SELECT teacher_id FROM courses WHERE id = $1',
          [courseId]
        );

        if (courseResult.rows.length === 0) {
          return res.status(404).json({ error: 'Cours non trouvé' });
        }

        if (courseResult.rows[0].teacher_id !== req.user.id) {
          return res.status(403).json({ error: 'Vous ne pouvez envoyer des messages qu\'aux étudiants de vos cours' });
        }
      }

      // Récupérer tous les étudiants inscrits au cours
      const enrolledStudents = await db.query(
        'SELECT student_id FROM enrollments WHERE course_id = $1 AND status = $2',
        [courseId, 'active']
      );
      recipients = enrolledStudents.rows.map(row => row.student_id);
    }

    if (recipients.length === 0) {
      return res.status(400).json({ error: 'Aucun destinataire trouvé' });
    }

    // Créer les messages
    const messages = [];
    for (const recipient of recipients) {
      const result = await db.query(`
        INSERT INTO messages (
          sender_id, recipient_id, course_id, subject, content,
          message_type, parent_message_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        req.user.id, recipient, courseId, subject, content,
        messageType || 'direct', parentMessageId
      ]);
      messages.push(result.rows[0]);
    }

    res.status(201).json({
      message: `${messages.length} message(s) envoyé(s) avec succès`,
      messages
    });

  } catch (error) {
    next(error);
  }
});

// Marquer un message comme lu
router.put('/:id/read', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'UPDATE messages SET is_read = true, read_at = NOW() WHERE id = $1 AND recipient_id = $2 RETURNING *',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message non trouvé' });
    }

    res.json({ message: 'Message marqué comme lu' });

  } catch (error) {
    next(error);
  }
});

// Supprimer un message
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Vérifier que le message appartient à l'utilisateur (expéditeur ou destinataire)
    const result = await db.query(
      'DELETE FROM messages WHERE id = $1 AND (sender_id = $2 OR recipient_id = $2) RETURNING *',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message non trouvé' });
    }

    res.json({ message: 'Message supprimé avec succès' });

  } catch (error) {
    next(error);
  }
});

// Récupérer les statistiques des messages
router.get('/stats/summary', async (req, res, next) => {
  try {
    const stats = await db.query(`
      SELECT 
        COUNT(CASE WHEN recipient_id = $1 AND is_read = false THEN 1 END) as unread_received,
        COUNT(CASE WHEN recipient_id = $1 THEN 1 END) as total_received,
        COUNT(CASE WHEN sender_id = $1 THEN 1 END) as total_sent
      FROM messages 
      WHERE sender_id = $1 OR recipient_id = $1
    `, [req.user.id]);

    res.json(stats.rows[0]);

  } catch (error) {
    next(error);
  }
});

module.exports = router;