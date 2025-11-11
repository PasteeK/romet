const express = require('express');
const router = express.Router();
const playerController = require('../controllers/player.controller');

const { authenticateToken } = require('../middleware/auth');

// Routes de gestion des joueurs
router.get('/', playerController.getAllPlayers);
router.get('/me', authenticateToken, playerController.getMe);

router.post('/add', playerController.createPlayer);
router.post('/login', playerController.login);

router.put('/me/tutorial', authenticateToken, playerController.setTutorial);

router.patch('/:id', authenticateToken, playerController.updatePlayer);
router.patch('/increment-games', authenticateToken, playerController.incrementGamesPlayed);

router.delete('/me', authenticateToken, playerController.deletePlayer);
router.delete('/delete/:id', playerController.deletePlayerById);

module.exports = router;