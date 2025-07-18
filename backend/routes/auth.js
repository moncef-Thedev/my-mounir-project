const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  fullName: Joi.string().min(2).required(),
  phone: Joi.string().optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

// Register
router.post('/register', async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password, fullName, phone } = value;

    // Check if user already exists
    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Un compte avec cet email existe déjà' });
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const userId = uuidv4();
    
    await db.query('BEGIN');
    
    try {
      // Insert into users table
      await db.query(
        'INSERT INTO users (id, email, password_hash, email_verified) VALUES ($1, $2, $3, $4)',
        [userId, email.toLowerCase(), passwordHash, false]
      );

      // Insert into profiles table
      await db.query(
        'INSERT INTO profiles (id, email, full_name, phone, role, is_active) VALUES ($1, $2, $3, $4, $5, $6)',
        [userId, email.toLowerCase(), fullName, phone || null, 'student', true]
      );

      await db.query('COMMIT');

      // Generate JWT token
      const token = jwt.sign(
        { userId, email: email.toLowerCase(), role: 'student' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        message: 'Inscription réussie',
        token,
        user: {
          id: userId,
          email: email.toLowerCase(),
          fullName,
          role: 'student'
        }
      });

    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password } = value;
    let cleanEmail = email.toLowerCase().trim();
    
    // Handle common email variations for the demo account
    if (cleanEmail === 'mounir@example') {
      cleanEmail = 'mounir@exemple.com';
    }

    // Get user with profile data
    const userResult = await db.query(
      `SELECT u.id, u.email, u.password_hash, u.login_attempts, u.locked_until,
              p.full_name, p.role, p.is_active
       FROM users u 
       JOIN profiles p ON u.id = p.id 
       WHERE u.email = $1`,
      [cleanEmail]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const user = userResult.rows[0];

    // Check if account is locked
    if (user.locked_until && new Date() < new Date(user.locked_until)) {
      return res.status(423).json({ 
        error: 'Compte temporairement verrouillé. Réessayez plus tard.' 
      });
    }

    // Check if account is active
    if (!user.is_active) {
      return res.status(401).json({ error: 'Compte désactivé' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      // Increment login attempts
      const newAttempts = (user.login_attempts || 0) + 1;
      let lockedUntil = null;
      
      if (newAttempts >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
      }

      await db.query(
        'UPDATE users SET login_attempts = $1, locked_until = $2 WHERE id = $3',
        [newAttempts, lockedUntil, user.id]
      );

      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Reset login attempts and update last login
    await db.query(
      'UPDATE users SET login_attempts = 0, locked_until = NULL, last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role
      }
    });

  } catch (error) {
    next(error);
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res, next) => {
  try {
    const profileResult = await db.query(
      `SELECT id, email, full_name, phone, role, avatar_url, date_of_birth, 
              address, emergency_contact, emergency_phone, preferences, 
              is_active, created_at, updated_at 
       FROM profiles WHERE id = $1`,
      [req.user.id]
    );

    if (profileResult.rows.length === 0) {
      return res.status(404).json({ error: 'Profil non trouvé' });
    }

    res.json(profileResult.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Update profile
router.put('/profile', authenticateToken, async (req, res, next) => {
  try {
    const updateSchema = Joi.object({
      fullName: Joi.string().min(2).optional(),
      phone: Joi.string().optional(),
      dateOfBirth: Joi.date().optional(),
      address: Joi.string().optional(),
      emergencyContact: Joi.string().optional(),
      emergencyPhone: Joi.string().optional(),
      preferences: Joi.object().optional()
    });

    const { error, value } = updateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    Object.entries(value).forEach(([key, val]) => {
      if (val !== undefined) {
        const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        updates.push(`${dbField} = $${paramCount}`);
        values.push(val);
        paramCount++;
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Aucune donnée à mettre à jour' });
    }

    values.push(req.user.id);
    
    const query = `
      UPDATE profiles 
      SET ${updates.join(', ')}, updated_at = NOW() 
      WHERE id = $${paramCount}
      RETURNING id, email, full_name, phone, role, avatar_url, date_of_birth, 
                address, emergency_contact, emergency_phone, preferences, is_active
    `;

    const result = await db.query(query, values);

    res.json({
      message: 'Profil mis à jour avec succès',
      profile: result.rows[0]
    });

  } catch (error) {
    next(error);
  }
});

// Reset password request
router.post('/reset-password', async (req, res, next) => {
  try {
    const { error, value } = resetPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email } = value;
    const cleanEmail = email.toLowerCase().trim();

    // Check if user exists
    const userResult = await db.query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
    
    if (userResult.rows.length === 0) {
      // Don't reveal if email exists for security
      return res.json({ message: 'Si cet email existe, un lien de réinitialisation a été envoyé' });
    }

    // Generate reset token
    const resetToken = uuidv4();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.query(
      'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE email = $3',
      [resetToken, resetExpires, cleanEmail]
    );

    // TODO: Send email with reset link
    console.log(`Reset token for ${cleanEmail}: ${resetToken}`);

    res.json({ message: 'Si cet email existe, un lien de réinitialisation a été envoyé' });

  } catch (error) {
    next(error);
  }
});

// Verify token
router.get('/verify-token', authenticateToken, (req, res) => {
  res.json({ 
    valid: true, 
    user: {
      id: req.user.id,
      email: req.user.email,
      fullName: req.user.full_name,
      role: req.user.role
    }
  });
});

module.exports = router;