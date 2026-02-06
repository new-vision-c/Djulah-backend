# Dockerfile pour Djulah Backend
FROM node:18-alpine

# Définition du répertoire de travail
WORKDIR /app

# Copie des fichiers package
COPY /package*.json ./

# Installation des dépendances
RUN npm ci --only=production

# Copie du code source
COPY . .

# Création du répertoire des scripts et permissions
RUN mkdir -p scripts && chmod +x scripts/*.js

# Exposition du port
EXPOSE 5000

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=5000

# Commande de démarrage
CMD ["npm", "start"]
