require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());

app.use(express.json());

// Import et utilisation des routes
app.use('/players', require('./routes/player.routes'));
app.use('/savegames', require('./routes/savegame.routes'));

// MongoDB
if (!MONGO_URI) {
  console.error('MONGO_URI not defined in .env');
  process.exit(1);
}
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;


mongoose.connect(MONGO_URI, {})
  .then(() => {
    console.log('MongoDB connecté');

    app.listen(PORT, () => {
      console.log(`Romet ouvert sur le port : ${PORT}`);
    });
  })
  .catch(err => console.error('Erreur de connexion MongoDB :', err));

// Erreurs
app.use((err, req, res, next) => {
  console.error('Erreur middleware :', err.message);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Erreur serveur'
  });
});

module.exports = app;