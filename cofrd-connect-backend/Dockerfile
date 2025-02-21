FROM node:16

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm install
RUN npm install socket.io

# Copier le reste des fichiers
COPY . .

# Exposer le port
EXPOSE 3001

# Commande pour démarrer l'application
CMD ["npm", "start"]