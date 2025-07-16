# Plateforme d'Enseignement - Mounir Ben Yahia

Une plateforme complète d'enseignement islamique avec gestion des cours, étudiants, et sessions en ligne.

## 🚀 Démarrage Rapide avec Docker

### Prérequis
- Docker et Docker Compose installés
- Node.js 18+ (pour le développement local)

### Installation

1. **Cloner le projet**
```bash
git clone <repository-url>
cd mounir-education-platform
```

2. **Configuration de l'environnement**
```bash
cp .env.example .env
# Modifier les variables d'environnement si nécessaire
```

3. **Démarrer avec Docker**
```bash
# Construire et démarrer tous les services
npm run docker:up

# Ou manuellement
docker-compose up -d
```

4. **Vérifier le déploiement**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api
- Base de données PostgreSQL: localhost:5432

### Commandes Docker Utiles

```bash
# Voir les logs
npm run docker:logs

# Arrêter les services
npm run docker:down

# Reconstruire les images
npm run docker:build

# Redémarrer un service spécifique
docker-compose restart backend
```

## 🏗️ Architecture

### Services
- **Frontend**: React + TypeScript + Vite (Port 5173)
- **Backend**: Node.js + Express + PostgreSQL (Port 3001)
- **Base de données**: PostgreSQL 15 (Port 5432)

### Structure du projet
```
├── src/                    # Code frontend React
├── backend/               # Code backend Node.js
├── database/             # Scripts SQL d'initialisation
├── docker-compose.yml    # Configuration Docker
└── README.md
```

## 🔧 Développement Local

### Sans Docker

1. **Base de données PostgreSQL**
```bash
# Installer PostgreSQL localement
# Créer la base de données 'mounir_education'
# Exécuter les scripts dans database/init/
```

2. **Backend**
```bash
cd backend
npm install
npm run dev
```

3. **Frontend**
```bash
npm install
npm run dev
```

### Avec Docker (Recommandé)

```bash
# Tout démarrer en une commande
npm run docker:up
```

## 📊 Fonctionnalités

### ✅ Authentification & Autorisation
- Inscription/Connexion sécurisée
- Gestion des rôles (Admin, Enseignant, Étudiant)
- Réinitialisation de mot de passe
- Protection par JWT

### ✅ Gestion des Cours
- Création/modification/suppression de cours
- Catégorisation par niveau et domaine
- Système d'inscription des étudiants
- Matériaux pédagogiques

### ✅ Calendrier & Sessions
- Planification des sessions de cours
- Sessions en ligne, présentiel ou hybride
- Gestion des liens de réunion
- Suivi de présence

### ✅ Notifications
- Notifications en temps réel
- Rappels automatiques
- Messages personnalisés
- Historique des notifications

### ✅ Tableaux de Bord
- Dashboard étudiant personnalisé
- Interface d'administration complète
- Statistiques et rapports
- Gestion des utilisateurs

### ✅ Évaluations
- Création de quiz et examens
- Système de notation
- Feedback personnalisé
- Suivi de progression

## 🔒 Sécurité

- Hashage des mots de passe avec bcrypt
- Protection contre les attaques par force brute
- Validation des données côté serveur
- Rate limiting sur les API
- Politiques de sécurité PostgreSQL (RLS)

## 🗄️ Base de Données

### Tables Principales
- `users` - Authentification
- `profiles` - Profils utilisateurs
- `courses` - Cours disponibles
- `course_sessions` - Sessions programmées
- `enrollments` - Inscriptions
- `notifications` - Système de notifications
- `assessments` - Évaluations
- `attendance` - Présence

### Données de Test
Le système inclut des données de démonstration :
- Compte admin : `mounir@exemple.com` / `password123`
- Comptes étudiants de test
- Cours d'exemple
- Sessions programmées

## 🚀 Déploiement en Production

### Variables d'Environnement
```bash
# Production
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET=your-super-secure-secret
CORS_ORIGIN=https://your-domain.com
```

### Docker en Production
```bash
# Utiliser docker-compose.prod.yml
docker-compose -f docker-compose.prod.yml up -d
```

## 📝 API Documentation

### Endpoints Principaux

#### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/profile` - Profil utilisateur
- `PUT /api/auth/profile` - Mise à jour profil

#### Cours
- `GET /api/courses` - Liste des cours
- `POST /api/courses` - Créer un cours
- `PUT /api/courses/:id` - Modifier un cours
- `DELETE /api/courses/:id` - Supprimer un cours

#### Inscriptions
- `POST /api/enrollments` - S'inscrire à un cours
- `GET /api/enrollments` - Mes inscriptions

#### Sessions
- `GET /api/sessions` - Sessions programmées
- `POST /api/sessions` - Créer une session

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Support

Pour toute question ou problème :
- Email : mounir@exemple.com
- Issues GitHub : [Créer une issue](https://github.com/your-repo/issues)

---

**Développé avec ❤️ pour l'éducation islamique moderne**