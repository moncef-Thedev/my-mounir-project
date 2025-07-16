const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Gestion des erreurs de connexion
pool.on('error', (err, client) => {
  console.error('Erreur inattendue sur le client de base de données inactif', err);
  process.exit(-1);
});

// Test de connexion au démarrage
pool.on('connect', () => {
  console.log('Nouvelle connexion établie avec la base de données');
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool
};