const errorHandler = (err, req, res, next) => {
  console.error('Erreur:', err);

  // Erreur de validation Joi
  if (err.isJoi) {
    return res.status(400).json({
      error: 'Données invalides',
      details: err.details.map(detail => detail.message)
    });
  }

  // Erreur de base de données PostgreSQL
  if (err.code) {
    switch (err.code) {
      case '23505': // Violation de contrainte unique
        return res.status(409).json({
          error: 'Cette ressource existe déjà',
          details: err.detail
        });
      case '23503': // Violation de clé étrangère
        return res.status(400).json({
          error: 'Référence invalide',
          details: err.detail
        });
      case '23514': // Violation de contrainte de vérification
        return res.status(400).json({
          error: 'Valeur non autorisée',
          details: err.detail
        });
      default:
        console.error('Erreur de base de données:', err);
        return res.status(500).json({
          error: 'Erreur de base de données'
        });
    }
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token invalide'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expiré'
    });
  }

  // Erreur de fichier trop volumineux
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'Fichier trop volumineux'
    });
  }

  // Erreur par défaut
  res.status(err.status || 500).json({
    error: err.message || 'Erreur interne du serveur'
  });
};

module.exports = errorHandler;