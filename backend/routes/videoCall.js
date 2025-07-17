const express = require('express');
const Joi = require('joi');
const db = require('../config/database');
const { requireTeacher, requireStudent } = require('../middleware/auth');

const router = express.Router();

// Validation schema for creating video calls
const videoCallSchema = Joi.object({
  sessionId: Joi.string().uuid().required(),
  platform: Joi.string().valid('zoom', 'google_meet', 'teams', 'jitsi').required(),
  scheduledFor: Joi.date().optional(),
  duration: Joi.number().integer().min(15).max(480).optional(),
  participants: Joi.array().items(Joi.string().uuid()).optional()
});

// Create video call (teachers/admins only)
router.post('/', requireTeacher, async (req, res, next) => {
  try {
    const { error, value } = videoCallSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { sessionId, platform, scheduledFor, duration } = value;

    // Verify session exists and user has permission
    const sessionResult = await db.query(`
      SELECT cs.*, c.teacher_id, c.title as course_title
      FROM course_sessions cs
      JOIN courses c ON cs.course_id = c.id
      WHERE cs.id = $1
    `, [sessionId]);

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];

    if (req.user.role !== 'admin' && session.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if video call already exists for this session
    const existingCall = await db.query(
      'SELECT id FROM video_calls WHERE session_id = $1 AND status IN ($2, $3)',
      [sessionId, 'scheduled', 'in_progress']
    );

    if (existingCall.rows.length > 0) {
      return res.status(409).json({ error: 'Video call already exists for this session' });
    }

    // Generate meeting URL based on platform
    let meetingUrl = '';
    let meetingId = '';
    let meetingPassword = '';

    const timestamp = Date.now();
    const randomId = Math.floor(Math.random() * 10000);

    switch (platform) {
      case 'zoom':
        meetingId = `${timestamp}${randomId}`;
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
      case 'jitsi':
        const jitsiRoom = `${session.course_title.replace(/\s+/g, '')}-${timestamp}`;
        meetingUrl = `https://meet.jit.si/${jitsiRoom}`;
        meetingId = jitsiRoom;
        break;
    }

    // Create video call record
    const result = await db.query(`
      INSERT INTO video_calls (
        session_id, created_by, platform, meeting_url, meeting_id, 
        meeting_password, scheduled_for, duration_minutes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      sessionId, 
      req.user.id, 
      platform, 
      meetingUrl, 
      meetingId,
      meetingPassword, 
      scheduledFor || `${session.session_date} ${session.start_time}`,
      duration || 90, 
      'scheduled'
    ]);

    // Update session with meeting URL
    await db.query(`
      UPDATE course_sessions 
      SET meeting_url = $1, meeting_password = $2, updated_at = NOW()
      WHERE id = $3
    `, [meetingUrl, meetingPassword, sessionId]);

    // Notify enrolled students
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
        'Video call scheduled',
        `A video call has been scheduled for session "${session.title}" on ${new Date(scheduledFor || `${session.session_date} ${session.start_time}`).toLocaleDateString()} at ${session.start_time}. Platform: ${platform}`,
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
      message: 'Video call created successfully',
      videoCall: result.rows[0],
      meetingUrl,
      meetingPassword: meetingPassword || null
    });

  } catch (error) {
    next(error);
  }
});

// Get video calls for a session
router.get('/session/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params;

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

    // If student, verify enrollment
    if (req.user.role === 'student') {
      accessQuery += ` AND EXISTS (
        SELECT 1 FROM enrollments e 
        WHERE e.course_id = c.id 
        AND e.student_id = $2 
        AND e.status = 'active'
      )`;
      params.push(req.user.id);
    }

    accessQuery += ` ORDER BY vc.created_at DESC`;

    const result = await db.query(accessQuery, params);

    res.json({
      videoCalls: result.rows
    });

  } catch (error) {
    next(error);
  }
});

// Start video call
router.post('/:id/start', requireTeacher, async (req, res, next) => {
  try {
    const { id } = req.params;

    const callResult = await db.query(`
      SELECT vc.*, cs.course_id, c.teacher_id
      FROM video_calls vc
      JOIN course_sessions cs ON vc.session_id = cs.id
      JOIN courses c ON cs.course_id = c.id
      WHERE vc.id = $1
    `, [id]);

    if (callResult.rows.length === 0) {
      return res.status(404).json({ error: 'Video call not found' });
    }

    const call = callResult.rows[0];

    if (req.user.role !== 'admin' && call.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (call.status !== 'scheduled') {
      return res.status(400).json({ error: 'Video call cannot be started' });
    }

    // Update call status
    await db.query(`
      UPDATE video_calls 
      SET status = 'in_progress', started_at = NOW(), updated_at = NOW()
      WHERE id = $1
    `, [id]);

    // Update session status
    await db.query(`
      UPDATE course_sessions 
      SET status = 'in_progress', updated_at = NOW()
      WHERE id = $1
    `, [call.session_id]);

    res.json({
      message: 'Video call started',
      meetingUrl: call.meeting_url,
      meetingPassword: call.meeting_password
    });

  } catch (error) {
    next(error);
  }
});

// End video call
router.post('/:id/end', requireTeacher, async (req, res, next) => {
  try {
    const { id } = req.params;

    const callResult = await db.query(`
      SELECT vc.*, cs.course_id, c.teacher_id
      FROM video_calls vc
      JOIN course_sessions cs ON vc.session_id = cs.id
      JOIN courses c ON cs.course_id = c.id
      WHERE vc.id = $1
    `, [id]);

    if (callResult.rows.length === 0) {
      return res.status(404).json({ error: 'Video call not found' });
    }

    const call = callResult.rows[0];

    if (req.user.role !== 'admin' && call.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (call.status !== 'in_progress') {
      return res.status(400).json({ error: 'Video call is not in progress' });
    }

    // Calculate actual duration
    const actualDuration = call.started_at ? 
      Math.round((new Date() - new Date(call.started_at)) / (1000 * 60)) : 0;

    // Update call status
    await db.query(`
      UPDATE video_calls 
      SET status = 'completed', ended_at = NOW(), actual_duration_minutes = $1, updated_at = NOW()
      WHERE id = $2
    `, [actualDuration, id]);

    // Update session status
    await db.query(`
      UPDATE course_sessions 
      SET status = 'completed', updated_at = NOW()
      WHERE id = $1
    `, [call.session_id]);

    res.json({
      message: 'Video call ended',
      actualDuration
    });

  } catch (error) {
    next(error);
  }
});

// Join video call (students and teachers)
router.get('/:id/join', async (req, res, next) => {
  try {
    const { id } = req.params;

    let accessQuery = `
      SELECT vc.*, cs.title as session_title, c.title as course_title
      FROM video_calls vc
      JOIN course_sessions cs ON vc.session_id = cs.id
      JOIN courses c ON cs.course_id = c.id
      WHERE vc.id = $1
    `;

    const params = [id];

    // If student, verify enrollment
    if (req.user.role === 'student') {
      accessQuery += ` AND EXISTS (
        SELECT 1 FROM enrollments e 
        WHERE e.course_id = c.id 
        AND e.student_id = $2 
        AND e.status = 'active'
      )`;
      params.push(req.user.id);
    }

    const callResult = await db.query(accessQuery, params);

    if (callResult.rows.length === 0) {
      return res.status(404).json({ error: 'Video call not found or access denied' });
    }

    const call = callResult.rows[0];

    // Check if call is available
    if (!['in_progress', 'scheduled'].includes(call.status)) {
      return res.status(400).json({ error: 'Video call is not available' });
    }

    // Record participation for students
    if (req.user.role === 'student') {
      await db.query(`
        INSERT INTO video_call_participants (call_id, participant_id, joined_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (call_id, participant_id) 
        DO UPDATE SET joined_at = NOW()
      `, [id, req.user.id]);
    }

    res.json({
      message: 'Access granted to video call',
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