FROM node:18-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci

# Copier le code source
COPY . .

# Exposer le port
EXPOSE 5173

# Commande de démarrage en mode développement
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]