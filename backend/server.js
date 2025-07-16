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
const videoCallRoutes = require('./routes/videoCall');
const calendarRoutes = require('./routes/calendar');

const errorHandler = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.CORS_ORIGIN 
      : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }
});

const PORT = process.env.PORT || 3001;

// Middleware de sécurité
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
}));
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // limite chaque IP
  message: {
    error: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
    retryAfter: 15 * 60 // 15 minutes en secondes
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Rate limiting plus strict pour l'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limite chaque IP à 5 tentatives de connexion par windowMs
  message: {
    error: 'Trop de tentatives de connexion, veuillez réessayer plus tard.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// CORS
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.NODE_ENV === 'production' 
      ? [process.env.CORS_ORIGIN]
      : [
          'http://localhost:5173',
          'http://localhost:3000',
          'http://127.0.0.1:5173',
          'http://127.0.0.1:3000'
        ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Non autorisé par CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// Logging
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir les fichiers statiques
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
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
app.use('/api/video-calls', authenticateToken, videoCallRoutes);
app.use('/api/calendar', authenticateToken, calendarRoutes);

// Gestion des erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route non trouvée',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
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
    socket.userRole = decoded.role;
    next();
  } catch (err) {
    next(new Error('Token invalide'));
  }
});

io.on('connection', (socket) => {
  console.log(`Utilisateur connecté: ${socket.userId} (${socket.userRole})`);
  
  // Rejoindre une room basée sur l'ID utilisateur
  socket.join(`user_${socket.userId}`);
  
  // Rejoindre une room basée sur le rôle
  socket.join(`role_${socket.userRole}`);
  
  // Gestion des événements de notification
  socket.on('mark_notification_read', async (notificationId) => {
    try {
      await db.query(
        'UPDATE notifications SET is_read = true WHERE id = $1 AND recipient_id = $2',
        [notificationId, socket.userId]
      );
      
      socket.emit('notification_marked_read', { notificationId });
    } catch (error) {
      console.error('Erreur lors du marquage de notification:', error);
    }
  });
  
  // Gestion des événements d'appel vidéo
  socket.on('join_video_call', (callId) => {
    socket.join(`video_call_${callId}`);
    socket.to(`video_call_${callId}`).emit('user_joined_call', {
      userId: socket.userId,
      timestamp: new Date().toISOString()
    });
  });
  
  socket.on('leave_video_call', (callId) => {
    socket.leave(`video_call_${callId}`);
    socket.to(`video_call_${callId}`).emit('user_left_call', {
      userId: socket.userId,
      timestamp: new Date().toISOString()
    });
  });
  
  socket.on('disconnect', () => {
    console.log(`Utilisateur déconnecté: ${socket.userId}`);
  });
});

// Rendre io accessible dans les routes
app.set('io', io);

// Fonction pour envoyer des notifications en temps réel
const sendRealTimeNotification = (recipientId, notification) => {
  io.to(`user_${recipientId}`).emit('new_notification', notification);
};

// Rendre la fonction accessible globalement
global.sendRealTimeNotification = sendRealTimeNotification;

// Démarrage du serveur
server.listen(PORT, async () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📊 API disponible sur http://localhost:${PORT}/api`);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
  
  // Test de connexion à la base de données
  try {
    await db.query('SELECT NOW() as current_time');
    console.log('✅ Connexion à la base de données réussie');
    
    // Exécuter les migrations si nécessaire
    if (process.env.NODE_ENV !== 'production') {
      try {
        const fs = require('fs');
        const path = require('path');
        const migrationPath = path.join(__dirname, 'database', 'migrations', '001_add_video_calls_table.sql');
        
        if (fs.existsSync(migrationPath)) {
          const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
          await db.query(migrationSQL);
          console.log('✅ Migrations exécutées avec succès');
        }
      } catch (migrationError) {
        console.warn('⚠️ Erreur lors de l\'exécution des migrations:', migrationError.message);
      }
    }
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error.message);
    process.exit(1);
  }
});

// Gestion propre de l'arrêt du serveur
const gracefulShutdown = (signal) => {
  console.log(`${signal} reçu, arrêt du serveur...`);
  
  server.close(() => {
    console.log('Serveur HTTP fermé');
    
    // Fermer les connexions de base de données
    if (db.pool) {
      db.pool.end(() => {
        console.log('Connexions de base de données fermées');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
  
  // Force l'arrêt après 10 secondes
  setTimeout(() => {
    console.error('Arrêt forcé du serveur');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

module.exports = app;