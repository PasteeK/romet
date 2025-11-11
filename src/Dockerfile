# Build Angular depuis node 22
FROM node:22-alpine AS builder

# Dossier de travail
WORKDIR /app

# Copie les fichiers package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste du projet
COPY . .

# Build Angular
RUN npm run build

# Serveur statique Node
FROM node:22-alpine

WORKDIR /app

# installer http-server
RUN npm install -g http-server

# Copier le build
COPY --from=builder /app/dist /app/dist

# Port d'exposition du serveur
EXPOSE 4200

# Lancer le serveur sur le dossier dist
CMD ["http-server", "dist", "-p", "4200"]
