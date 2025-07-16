const express = require('express');
const Joi = require('joi');
const db = require('../config/database');
const { requireTeacher } = require('../middleware/auth');

const router = express.Router();

// Schéma de validation pour créer une notification
const notificationSchema = Joi.object({
  recipientId: Joi.string().uuid().optional(),
  courseId: Joi.string().uuid().optional(),
  title: Joi.string().min(3).max(200).required(),
  message: Joi.string().min(10).required(),
  notificationType: Joi.string().valid('course_reminder', 'enrollment', 'assignment', 'announcement', 'system').required(),
  priority: Joi.string().valid('low', 'normal', 'high', 'urgent').optional(),
  scheduledFor: Joi.date().optional()
});

// Récupérer les notifications de l'utilisateur connecté
router.get('/', async (req, res, next) => {
  try {
    const { unreadOnly, limit = 50 } = req.query;
    
    let query = `
      SELECT n.*, c.title as course_title, s.full_name as sender_name
      FROM notifications n
      LEFT JOIN courses c ON n.related_course_id = c.id
      LEFT JOIN profiles s ON n.sender_id = s.id
      WHERE n.recipient_id = $1
    `;
    
    const params = [req.user.id];

    if (unreadOnly === 'true') {
      query += ` AND n.is_read = false`;
    }

    query += ` ORDER BY n.created_at DESC LIMIT $2`;
    params.push(parseInt(limit));

    const result = await db.query(query, params);

    // Compter les notifications non lues
    const unreadResult = await db.query(
      'SELECT COUNT(*) as unread_count FROM notifications WHERE recipient_id = $1 AND is_read = false',
      [req.user.id]
    );

    res.json({
      notifications: result.rows,
      unreadCount: parseInt(unreadResult.rows[0].unread_count)
    });

  } catch (error) {
    next(error);
  }
});

// Marquer une notification comme lue
router.put('/:id/read', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Vérifier que la notification appartient à l'utilisateur
    const result = await db.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND recipient_id = $2 RETURNING *',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification non trouvée' });
    }

    res.json({ message: 'Notification marquée comme lue' });

  } catch (error) {
    next(error);
  }
});

// Marquer toutes les notifications comme lues
router.put('/read-all', async (req, res, next) => {
  try {
    await db.query(
      'UPDATE notifications SET is_read = true WHERE recipient_id = $1 AND is_read = false',
      [req.user.id]
    );

    res.json({ message: 'Toutes les notifications ont été marquées comme lues' });

  } catch (error) {
    next(error);
  }
});

// Créer une notification (enseignants/admins seulement)
router.post('/', requireTeacher, async (req, res, next) => {
  try {
    const { error, value } = notificationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const {
      recipientId, courseId, title, message, notificationType,
      priority, scheduledFor
    } = value;

    let recipients = [];

    if (recipientId) {
      // Notification à un utilisateur spécifique
      recipients = [recipientId];
    } else if (courseId) {
      // Notification à tous les étudiants d'un cours
      const enrolledStudents = await db.query(
        'SELECT student_id FROM enrollments WHERE course_id = $1 AND status = $2',
        [courseId, 'active']
      );
      recipients = enrolledStudents.rows.map(row => row.student_id);
    } else {
      return res.status(400).json({ error: 'Vous devez spécifier un destinataire ou un cours' });
    }

    if (recipients.length === 0) {
      return res.status(400).json({ error: 'Aucun destinataire trouvé' });
    }

    // Créer les notifications
    const notifications = [];
    for (const recipient of recipients) {
      const result = await db.query(`
        INSERT INTO notifications (
          recipient_id, sender_id, title, message, notification_type,
          related_course_id, priority, scheduled_for
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        recipient, req.user.id, title, message, notificationType,
        courseId, priority || 'normal', scheduledFor
      ]);
      notifications.push(result.rows[0]);
    }

    // Envoyer les notifications en temps réel via Socket.IO
    const io = req.app.get('io');
    notifications.forEach(notification => {
      io.to(`user_${notification.recipient_id}`).emit('new_notification', notification);
    });

    res.status(201).json({
      message: `${notifications.length} notification(s) créée(s) avec succès`,
      notifications
    });

  } catch (error) {
    next(error);
  }
});

// Supprimer une notification
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Vérifier que la notification appartient à l'utilisateur
    const result = await db.query(
      'DELETE FROM notifications WHERE id = $1 AND recipient_id = $2 RETURNING *',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification non trouvée' });
    }

    res.json({ message: 'Notification supprimée avec succès' });

  } catch (error) {
    next(error);
  }
});

module.exports = router;