const express = require('express');
const router = express.Router();
const playerController = require('../controllers/player.controller');
const Player = require('../schemas/Player');

// Routes de gestion des joueurs
router.get('/', playerController.getAllPlayers);
router.post('/add', async (req, res) => {
  try {
    const existingPlayer = await Player.findOne({ username: req.body.username });
    if (existingPlayer) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    const newPlayer = new Player(req.body);
    await newPlayer.save();
    res.status(201).json({ message: 'Player added successfully' });

  } catch (err) {
    console.error('Error while adding player:', err);
    res.status(500).json({ message: 'Error while adding player' });
  }
});
router.put('/update/:id', playerController.updatePlayer);

module.exports = router;