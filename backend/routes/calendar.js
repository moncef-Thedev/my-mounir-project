const express = require('express');
const Joi = require('joi');
const db = require('../config/database');
const { requireTeacher } = require('../middleware/auth');

const router = express.Router();

// Récupérer le calendrier complet
router.get('/', async (req, res, next) => {
  try {
    const { month, year, courseId } = req.query;
    
    let query = `
      SELECT cs.*, c.title as course_title, c.category, c.level,
             p.full_name as teacher_name,
             COUNT(DISTINCT e.student_id) as enrolled_students,
             vc.meeting_url, vc.meeting_password, vc.platform as call_platform
      FROM course_sessions cs
      JOIN courses c ON cs.course_id = c.id
      LEFT JOIN profiles p ON c.teacher_id = p.id
      LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
      LEFT JOIN video_calls vc ON cs.id = vc.session_id AND vc.status IN ('scheduled', 'in_progress')
      WHERE c.is_active = true
    `;
    
    const params = [];
    let paramCount = 1;

    // Filtrer par mois/année si spécifié
    if (month && year) {
      query += ` AND EXTRACT(MONTH FROM cs.session_date) = $${paramCount} 
                 AND EXTRACT(YEAR FROM cs.session_date) = $${paramCount + 1}`;
      params.push(parseInt(month), parseInt(year));
      paramCount += 2;
    }

    // Filtrer par cours si spécifié
    if (courseId) {
      query += ` AND cs.course_id = $${paramCount}`;
      params.push(courseId);
      paramCount++;
    }

    // Si c'est un étudiant, ne montrer que les sessions des cours auxquels il est inscrit
    if (req.user.role === 'student') {
      query += ` AND EXISTS (
        SELECT 1 FROM enrollments e2 
        WHERE e2.course_id = cs.course_id 
        AND e2.student_id = $${paramCount} 
        AND e2.status = 'active'
      )`;
      params.push(req.user.id);
      paramCount++;
    }

    query += ` GROUP BY cs.id, c.id, p.id, vc.id
               ORDER BY cs.session_date ASC, cs.start_time ASC`;

    const result = await db.query(query, params);

    // Organiser les sessions par date pour faciliter l'affichage du calendrier
    const sessionsByDate = {};
    result.rows.forEach(session => {
      const dateKey = session.session_date.toISOString().split('T')[0];
      if (!sessionsByDate[dateKey]) {
        sessionsByDate[dateKey] = [];
      }
      sessionsByDate[dateKey].push({
        ...session,
        hasVideoCall: !!session.meeting_url,
        canJoinCall: session.call_platform && ['scheduled', 'in_progress'].includes(session.status)
      });
    });

    res.json({
      sessions: result.rows,
      sessionsByDate,
      totalSessions: result.rows.length
    });

  } catch (error) {
    next(error);
  }
});

// Récupérer les événements d'une date spécifique
router.get('/date/:date', async (req, res, next) => {
  try {
    const { date } = req.params;

    let query = `
      SELECT cs.*, c.title as course_title, c.category, c.level,
             p.full_name as teacher_name,
             COUNT(DISTINCT e.student_id) as enrolled_students,
             vc.meeting_url, vc.meeting_password, vc.platform as call_platform,
             vc.status as call_status
      FROM course_sessions cs
      JOIN courses c ON cs.course_id = c.id
      LEFT JOIN profiles p ON c.teacher_id = p.id
      LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
      LEFT JOIN video_calls vc ON cs.id = vc.session_id
      WHERE cs.session_date = $1 AND c.is_active = true
    `;

    const params = [date];

    // Si c'est un étudiant, ne montrer que les sessions des cours auxquels il est inscrit
    if (req.user.role === 'student') {
      query += ` AND EXISTS (
        SELECT 1 FROM enrollments e2 
        WHERE e2.course_id = cs.course_id 
        AND e2.student_id = $2 
        AND e2.status = 'active'
      )`;
      params.push(req.user.id);
    }

    query += ` GROUP BY cs.id, c.id, p.id, vc.id
               ORDER BY cs.start_time ASC`;

    const result = await db.query(query, params);

    res.json({
      date,
      sessions: result.rows.map(session => ({
        ...session,
        hasVideoCall: !!session.meeting_url,
        canJoinCall: session.call_platform && ['scheduled', 'in_progress'].includes(session.call_status)
      }))
    });

  } catch (error) {
    next(error);
  }
});

// Récupérer les sessions à venir (prochains 7 jours)
router.get('/upcoming', async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    let query = `
      SELECT cs.*, c.title as course_title, c.category,
             p.full_name as teacher_name,
             vc.meeting_url, vc.platform as call_platform
      FROM course_sessions cs
      JOIN courses c ON cs.course_id = c.id
      LEFT JOIN profiles p ON c.teacher_id = p.id
      LEFT JOIN video_calls vc ON cs.id = vc.session_id AND vc.status IN ('scheduled', 'in_progress')
      WHERE c.is_active = true
      AND (
        cs.session_date > CURRENT_DATE 
        OR (cs.session_date = CURRENT_DATE AND cs.start_time > CURRENT_TIME)
      )
    `;

    const params = [];

    // Si c'est un étudiant, ne montrer que les sessions des cours auxquels il est inscrit
    if (req.user.role === 'student') {
      query += ` AND EXISTS (
        SELECT 1 FROM enrollments e 
        WHERE e.course_id = cs.course_id 
        AND e.student_id = $1 
        AND e.status = 'active'
      )`;
      params.push(req.user.id);
    }

    query += ` ORDER BY cs.session_date ASC, cs.start_time ASC
               LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));

    const result = await db.query(query, params);

    res.json({
      upcomingSessions: result.rows.map(session => ({
        ...session,
        hasVideoCall: !!session.meeting_url,
        daysUntil: Math.ceil((new Date(session.session_date) - new Date()) / (1000 * 60 * 60 * 24))
      }))
    });

  } catch (error) {
    next(error);
  }
});

// Récupérer les statistiques du calendrier
router.get('/stats', async (req, res, next) => {
  try {
    const { month, year } = req.query;

    let baseQuery = `
      FROM course_sessions cs
      JOIN courses c ON cs.course_id = c.id
      WHERE c.is_active = true
    `;

    const params = [];
    let paramCount = 1;

    if (month && year) {
      baseQuery += ` AND EXTRACT(MONTH FROM cs.session_date) = $${paramCount} 
                     AND EXTRACT(YEAR FROM cs.session_date) = $${paramCount + 1}`;
      params.push(parseInt(month), parseInt(year));
      paramCount += 2;
    }

    // Si c'est un étudiant, ne compter que les sessions des cours auxquels il est inscrit
    if (req.user.role === 'student') {
      baseQuery += ` AND EXISTS (
        SELECT 1 FROM enrollments e 
        WHERE e.course_id = cs.course_id 
        AND e.student_id = $${paramCount} 
        AND e.status = 'active'
      )`;
      params.push(req.user.id);
    }

    // Statistiques générales
    const statsQuery = `
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN cs.session_date > CURRENT_DATE OR 
                         (cs.session_date = CURRENT_DATE AND cs.start_time > CURRENT_TIME) 
                   THEN 1 END) as upcoming_sessions,
        COUNT(CASE WHEN cs.session_type = 'online' THEN 1 END) as online_sessions,
        COUNT(CASE WHEN cs.session_type = 'in_person' THEN 1 END) as in_person_sessions,
        COUNT(CASE WHEN cs.session_type = 'hybrid' THEN 1 END) as hybrid_sessions,
        COUNT(CASE WHEN cs.status = 'completed' THEN 1 END) as completed_sessions
      ${baseQuery}
    `;

    const statsResult = await db.query(statsQuery, params);

    // Sessions par jour de la semaine
    const weekdayQuery = `
      SELECT 
        EXTRACT(DOW FROM cs.session_date) as day_of_week,
        COUNT(*) as session_count
      ${baseQuery}
      GROUP BY EXTRACT(DOW FROM cs.session_date)
      ORDER BY day_of_week
    `;

    const weekdayResult = await db.query(weekdayQuery, params);

    // Sessions avec appels vidéo
    const videoCallQuery = `
      SELECT COUNT(DISTINCT cs.id) as sessions_with_video_calls
      ${baseQuery}
      AND EXISTS (SELECT 1 FROM video_calls vc WHERE vc.session_id = cs.id)
    `;

    const videoCallResult = await db.query(videoCallQuery, params);

    const weekdays = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const sessionsByWeekday = weekdays.map((day, index) => {
      const dayData = weekdayResult.rows.find(row => parseInt(row.day_of_week) === index);
      return {
        day,
        count: dayData ? parseInt(dayData.session_count) : 0
      };
    });

    res.json({
      ...statsResult.rows[0],
      sessions_with_video_calls: parseInt(videoCallResult.rows[0].sessions_with_video_calls),
      sessionsByWeekday
    });

  } catch (error) {
    next(error);
  }
});

// Exporter le calendrier (format iCal)
router.get('/export', async (req, res, next) => {
  try {
    const { courseId } = req.query;

    let query = `
      SELECT cs.*, c.title as course_title, c.description as course_description,
             p.full_name as teacher_name
      FROM course_sessions cs
      JOIN courses c ON cs.course_id = c.id
      LEFT JOIN profiles p ON c.teacher_id = p.id
      WHERE c.is_active = true
    `;

    const params = [];
    let paramCount = 1;

    if (courseId) {
      query += ` AND cs.course_id = $${paramCount}`;
      params.push(courseId);
      paramCount++;
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
    }

    query += ` ORDER BY cs.session_date ASC, cs.start_time ASC`;

    const result = await db.query(query, params);

    // Générer le contenu iCal
    let icalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Mounir Ben Yahia//Education Platform//FR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];

    result.rows.forEach(session => {
      const startDateTime = new Date(`${session.session_date}T${session.start_time}`);
      const endDateTime = new Date(`${session.session_date}T${session.end_time}`);
      
      const formatDate = (date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };

      icalContent.push(
        'BEGIN:VEVENT',
        `UID:${session.id}@education.mounir.com`,
        `DTSTART:${formatDate(startDateTime)}`,
        `DTEND:${formatDate(endDateTime)}`,
        `SUMMARY:${session.title} - ${session.course_title}`,
        `DESCRIPTION:${session.description || session.course_description || ''}`,
        `LOCATION:${session.location || session.meeting_url || 'En ligne'}`,
        `ORGANIZER:CN=${session.teacher_name}`,
        `STATUS:${session.status.toUpperCase()}`,
        'END:VEVENT'
      );
    });

    icalContent.push('END:VCALENDAR');

    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', 'attachment; filename="calendrier-cours.ics"');
    res.send(icalContent.join('\r\n'));

  } catch (error) {
    next(error);
  }
});

module.exports = router;