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

router.post('/login', playerController.login);

router.get('/me', authenticateToken, playerController.getMe);

router.patch('/:id', authenticateToken, playerController.updatePlayer);

router.patch('/increment-games', authenticateToken, playerController.incrementGamesPlayed);

router.delete('/me', authenticateToken, playerController.deletePlayer);

router.delete('/delete/:id', playerController.deletePlayerById);

module.exports = router;