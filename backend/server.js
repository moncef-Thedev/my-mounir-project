const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const db = require('./config/database');
const authRoutes = require('./routes/auth');
const coursesRoutes = require('./routes/courses');
const sessionsRoutes = require('./routes/sessions');
const enrollmentsRoutes = require('./routes/enrollments');
const notificationsRoutes = require('./routes/notifications');
const materialsRoutes = require('./routes/materials');
const assessmentsRoutes = require('./routes/assessments');
const messagesRoutes = require('./routes/messages');
const attendanceRoutes = require('./routes/attendance');
const dashboardRoutes = require('./routes/dashboard');

const errorHandler = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    credentials: false // Set to false when using '*'
  }
});

const PORT = process.env.PORT || 3001;

// Middleware de sécurité
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limitle chaque IP à 100 requêtes par windowMs
  message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
});
app.use('/api/', limiter);

// Rate limiting plus strict pour l'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limite chaque IP à 5 tentatives de connexion par windowMs
  message: 'Trop de tentatives de connexion, veuillez réessayer plus tard.'
});
app.use('/api/auth/login', authLimiter);

// CORS
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 200
}));

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir les fichiers statiques
app.use('/uploads', express.static('uploads'));

// Routes publiques
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Routes d'authentification
app.use('/api/auth', authRoutes);

// Routes protégées
app.use('/api/courses', authenticateToken, coursesRoutes);
app.use('/api/sessions', authenticateToken, sessionsRoutes);
app.use('/api/enrollments', authenticateToken, enrollmentsRoutes);
app.use('/api/notifications', authenticateToken, notificationsRoutes);
app.use('/api/materials', authenticateToken, materialsRoutes);
app.use('/api/assessments', authenticateToken, assessmentsRoutes);
app.use('/api/messages', authenticateToken, messagesRoutes);
app.use('/api/attendance', authenticateToken, attendanceRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);

// Gestion des erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route non trouvée',
    path: req.originalUrl 
  });
});

// Middleware de gestion d'erreurs
app.use(errorHandler);

// Configuration Socket.IO pour les notifications en temps réel
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Token manquant'));
  }
  
  const jwt = require('jsonwebtoken');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error('Token invalide'));
  }
});

io.on('connection', (socket) => {
  console.log(`Utilisateur connecté: ${socket.userId}`);
  
  // Rejoindre une room basée sur l'ID utilisateur
  socket.join(`user_${socket.userId}`);
  
  socket.on('disconnect', () => {
    console.log(`Utilisateur déconnecté: ${socket.userId}`);
  });
});

// Rendre io accessible dans les routes
app.set('io', io);

// Démarrage du serveur
server.listen(PORT, async () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📊 API disponible sur http://localhost:${PORT}/api`);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
  
  // Test de connexion à la base de données
  try {
    await db.query('SELECT NOW()');
    console.log('✅ Connexion à la base de données réussie');
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error.message);
  }
});

// Gestion propre de l'arrêt du serveur
process.on('SIGTERM', () => {
  console.log('SIGTERM reçu, arrêt du serveur...');
  server.close(() => {
    console.log('Serveur arrêté');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT reçu, arrêt du serveur...');
  server.close(() => {
    console.log('Serveur arrêté');
    process.exit(0);
  });
});

module.exports = app;