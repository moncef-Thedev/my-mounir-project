const express = require('express');
const db = require('../config/database');
const { requireTeacher } = require('../middleware/auth');

const router = express.Router();

// Statistiques générales pour le tableau de bord
router.get('/stats', async (req, res, next) => {
  try {
    let stats = {};

    if (req.user.role === 'student') {
      // Statistiques pour les étudiants
      const enrollmentStats = await db.query(`
        SELECT 
          COUNT(*) as total_enrollments,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_enrollments,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_enrollments,
          AVG(completion_percentage) as average_progress
        FROM enrollments 
        WHERE student_id = $1
      `, [req.user.id]);

      const upcomingSessions = await db.query(`
        SELECT COUNT(*) as upcoming_sessions
        FROM course_sessions cs
        JOIN enrollments e ON cs.course_id = e.course_id
        WHERE e.student_id = $1 
        AND e.status = 'active'
        AND (cs.session_date > CURRENT_DATE OR (cs.session_date = CURRENT_DATE AND cs.start_time > CURRENT_TIME))
      `, [req.user.id]);

      const unreadNotifications = await db.query(`
        SELECT COUNT(*) as unread_notifications
        FROM notifications 
        WHERE recipient_id = $1 AND is_read = false
      `, [req.user.id]);

      stats = {
        totalEnrollments: parseInt(enrollmentStats.rows[0].total_enrollments),
        activeEnrollments: parseInt(enrollmentStats.rows[0].active_enrollments),
        completedEnrollments: parseInt(enrollmentStats.rows[0].completed_enrollments),
        averageProgress: parseFloat(enrollmentStats.rows[0].average_progress) || 0,
        upcomingSessions: parseInt(upcomingSessions.rows[0].upcoming_sessions),
        unreadNotifications: parseInt(unreadNotifications.rows[0].unread_notifications)
      };

    } else {
      // Statistiques pour les enseignants/admins
      let courseFilter = '';
      let params = [];
      
      if (req.user.role === 'teacher') {
        courseFilter = 'WHERE c.teacher_id = $1';
        params = [req.user.id];
      }

      const courseStats = await db.query(`
        SELECT 
          COUNT(*) as total_courses,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_courses
        FROM courses c
        ${courseFilter}
      `, params);

      const studentStats = await db.query(`
        SELECT 
          COUNT(DISTINCT e.student_id) as total_students,
          COUNT(CASE WHEN e.status = 'active' THEN 1 END) as active_enrollments
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        ${courseFilter}
      `, params);

      const sessionStats = await db.query(`
        SELECT 
          COUNT(*) as total_sessions,
          COUNT(CASE WHEN cs.session_date > CURRENT_DATE OR (cs.session_date = CURRENT_DATE AND cs.start_time > CURRENT_TIME) THEN 1 END) as upcoming_sessions
        FROM course_sessions cs
        JOIN courses c ON cs.course_id = c.id
        ${courseFilter}
      `, params);

      stats = {
        totalCourses: parseInt(courseStats.rows[0].total_courses),
        activeCourses: parseInt(courseStats.rows[0].active_courses),
        totalStudents: parseInt(studentStats.rows[0].total_students),
        activeEnrollments: parseInt(studentStats.rows[0].active_enrollments),
        totalSessions: parseInt(sessionStats.rows[0].total_sessions),
        upcomingSessions: parseInt(sessionStats.rows[0].upcoming_sessions)
      };
    }

    res.json(stats);

  } catch (error) {
    next(error);
  }
});

// Activité récente
router.get('/activity', async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    let activities = [];

    if (req.user.role === 'student') {
      // Activités pour les étudiants
      const recentEnrollments = await db.query(`
        SELECT 
          'enrollment' as type,
          e.enrollment_date as date,
          c.title as course_title,
          e.status
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        WHERE e.student_id = $1
        ORDER BY e.enrollment_date DESC
        LIMIT $2
      `, [req.user.id, parseInt(limit)]);

      activities = recentEnrollments.rows;

    } else {
      // Activités pour les enseignants/admins
      let courseFilter = '';
      let params = [parseInt(limit)];
      
      if (req.user.role === 'teacher') {
        courseFilter = 'AND c.teacher_id = $2';
        params = [parseInt(limit), req.user.id];
      }

      const recentActivities = await db.query(`
        (
          SELECT 
            'enrollment' as type,
            e.enrollment_date as date,
            c.title as course_title,
            p.full_name as student_name,
            e.status
          FROM enrollments e
          JOIN courses c ON e.course_id = c.id
          JOIN profiles p ON e.student_id = p.id
          WHERE 1=1 ${courseFilter}
          ORDER BY e.enrollment_date DESC
          LIMIT $1
        )
        UNION ALL
        (
          SELECT 
            'session' as type,
            cs.created_at as date,
            c.title as course_title,
            cs.title as session_title,
            cs.status
          FROM course_sessions cs
          JOIN courses c ON cs.course_id = c.id
          WHERE 1=1 ${courseFilter}
          ORDER BY cs.created_at DESC
          LIMIT $1
        )
        ORDER BY date DESC
        LIMIT $1
      `, params);

      activities = recentActivities.rows;
    }

    res.json({ activities });

  } catch (error) {
    next(error);
  }
});

module.exports = router;