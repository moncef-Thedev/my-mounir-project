const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token d\'accès requis' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Vérifier que l'utilisateur existe toujours et est actif
    const userResult = await db.query(
      'SELECT u.id, u.email, p.full_name, p.role, p.is_active FROM users u JOIN profiles p ON u.id = p.id WHERE u.id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    const user = userResult.rows[0];
    
    if (!user.is_active) {
      return res.status(401).json({ error: 'Compte désactivé' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    return res.status(403).json({ error: 'Token invalide' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentification requise' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Permissions insuffisantes' });
    }

    next();
  };
};

const requireAdmin = requireRole(['admin']);
const requireTeacher = requireRole(['admin', 'teacher']);
const requireStudent = requireRole(['student', 'admin', 'teacher']);

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireTeacher,
  requireStudent
};