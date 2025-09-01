const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/savegame.controller');

// Base: /savegames
router.get('/current', ctrl.getCurrent);
router.post('/start',   ctrl.start);
router.patch('/:id/move', ctrl.move);
router.post('/:id/combat/start', ctrl.combatStart);
router.post('/:id/combat/end',   ctrl.combatEnd);
router.patch('/:id', ctrl.patch);

module.exports = router;
