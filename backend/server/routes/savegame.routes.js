const router = require('express').Router();
const ctrl = require('../controllers/savegame.controller');

// Base attendue par ton service: http://localhost:3000/savegames
router.get('/current', ctrl.getCurrent);
router.post('/start', ctrl.start);
router.patch('/:id/move', ctrl.move);               // ← PATCH comme dans ton service
router.post('/:id/combat/start', ctrl.combatStart);
router.post('/:id/combat/end', ctrl.combatEnd);

module.exports = router;
