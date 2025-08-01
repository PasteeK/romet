require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());


app.use(express.json());

// Import et utilisation des routes
const playerRoutes = require('./routes/player.routes');
app.use('/players', playerRoutes);

// MongoDB
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI est manquant dans le fichier .env');
  process.exit(1);
}

mongoose.connect(MONGO_URI, {})
  .then(() => {
    console.log('✅ MongoDB connecté');

    app.listen(PORT, () => {
      console.log(`🚀 Romet ouvert sur le port : ${PORT}`);
    });
  })
  .catch(err => console.error('❌ Erreur de connexion MongoDB :', err));

// Erreurs
app.use((err, req, res, next) => {
  console.error('Erreur attrapée par le middleware :', err.message);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Erreur interne du serveur'
  });
});