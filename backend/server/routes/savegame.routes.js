const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/savegame.controller');

// routes de gestion des saves
router.get('/current', ctrl.getCurrent);

router.post('/start',   ctrl.start);
router.post('/:id/combat/start', ctrl.combatStart);
router.post('/:id/combat/end',   ctrl.combatEnd);

router.patch('/:id/move', ctrl.move);
router.patch('/:id', ctrl.patch);

module.exports = router;
