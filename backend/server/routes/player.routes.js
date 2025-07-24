const express = require('express');
const router = express.Router();
const playerController = require('../controllers/player.controller');
const Player = require('../schemas/Player');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../middleware/auth');

// Routes de gestion des joueurs
router.get('/', playerController.getAllPlayers);

router.post('/add', playerController.createPlayer);

router.post('/login', async (req, res) => {
  try {
    const player = await Player.findOne({ username: req.body.username });
    if (!player) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const isPasswordValid = await bcrypt.compare(req.body.password, player.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign({ id: player._id }, process.env.JWT_SECRET);
    res.status(200).json({ token });
  } catch (err) {
    console.error('Error while logging in:', err);
    res.status(500).json({ message: 'Error while logging in' });
  }
});

router.get('/me', authenticateToken, playerController.getMe);

router.put('/update/:id', playerController.updatePlayer);

module.exports = router;