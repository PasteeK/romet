# Docker depuis node 22
FROM node:22-alpine

# Création du dossier de travail dans le conteneur
WORKDIR /app

# Copie des fichiers package.json et package-lock.json
COPY package*.json ./

# Installation des dependences
RUN npm install

# Copie le reste du code
COPY . .

# Exposition du port 3000
EXPOSE 3000

# Lancement du serveur via NPM
CMD ["npm", "start"]
