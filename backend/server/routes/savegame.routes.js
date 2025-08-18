const router = require('express').Router();
const Savegame = require('../schemas/Savegame');
const Player = require('../schemas/Player');
const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.id_user || payload.userId || payload.sub || payload.id;
    next();
  } catch (e) { res.status(401).json({ message: 'Invalid token' }); }
}

// Récupérer la save en cours
router.get('/current', auth, async (req, res) => {
  const player = await Player.findById(req.userId).lean();
  if (!player) return res.status(404).json({ message: 'Player not found' });

  const save = await Savegame.findOne({ player: player._id, status: 'in_progress' })
    .sort({ updatedAt: -1 })
    .lean();

  res.json(save || null);
});

// Démarrer une nouvelle partie
router.post('/start', auth, async (req, res) => {
  const { seed, difficulty = 'normal', mapNodes = [], startNodeId, startingHp = 100, maxHp = 100 } = req.body;

  await Savegame.updateMany({ player: req.userId, status: 'in_progress' }, { $set: { status: 'abandoned' } });

  const save = await Savegame.create({
    player: req.userId,
    status: 'in_progress',
    seed, difficulty,
    floor: 1,
    mapNodes,
    currentNodeId: startNodeId,
    pathTaken: [startNodeId],
    playerState: { hp: startingHp, maxHp, gold: 0, energyMax: 3, relics: [], potions: [] },
    decklist: [],
    drawOrder: [], discardOrder: [], exhaustOrder: [],
    combat: null, shop: null,
    clientTick: 0
  });

  res.status(201).json(save);
});

// Déplacement sur la map
router.patch('/:id/move', auth, async (req, res) => {
  const { targetNodeId, clientTick } = req.body;
  const save = await Savegame.findOne({ _id: req.params.id, player: req.userId, status: 'in_progress' });
  if (!save) return res.status(404).json({ message: 'Savegame not found' });

  if (clientTick !== undefined && clientTick !== save.clientTick)
    return res.status(409).json({ message: 'Desync' });

  const current = save.mapNodes.find(n => n.id === save.currentNodeId);
  const target  = save.mapNodes.find(n => n.id === targetNodeId);
  if (!current || !target) return res.status(400).json({ message: 'Invalid nodes' });
  if (!current.neighbors.includes(targetNodeId)) return res.status(400).json({ message: 'Illegal move' });

  current.state = 'cleared';
  save.currentNodeId = targetNodeId;
  save.pathTaken.push(targetNodeId);

  save.mapNodes.forEach(n => {
    if (target.neighbors.includes(n.id) && n.state === 'locked') n.state = 'available';
  });

  save.clientTick += 1;
  await save.save();
  res.json(save);
});

// Démarrer un combat
router.post('/:id/combat/start', auth, async (req, res) => {
  const { encounterId, rngSeed, monsters, draw = [], hand = [], discard = [], exhaust = [] } = req.body;
  const save = await Savegame.findOne({ _id: req.params.id, player: req.userId, status: 'in_progress' });
  if (!save) return res.status(404).json({ message: 'Savegame not found' });
  if (save.combat) return res.status(400).json({ message: 'Combat already active' });

  save.combat = {
    encounterId,
    rngSeed,
    turn: 1,
    playerBlock: 0,
    playerEffects: [],
    monsters,
    draw: { cards: draw },
    hand: { cards: hand },
    discard: { cards: discard },
    exhaust: { cards: exhaust }
  };

  await save.save();
  res.json(save);
});

// Fin de combat
router.post('/:id/combat/end', auth, async (req, res) => {
  const { result, playerHp, goldDelta = 0, addCards = [], removeCardsIids = [] } = req.body;
  const save = await Savegame.findOne({ _id: req.params.id, player: req.userId, status: 'in_progress' });
  if (!save || !save.combat) return res.status(400).json({ message: 'No active combat' });

  save.playerState.hp = Math.max(0, Math.min(playerHp, save.playerState.maxHp));
  save.playerState.gold = Math.max(0, save.playerState.gold + goldDelta);

  if (removeCardsIids.length) {
    save.decklist = save.decklist.filter(c => !removeCardsIids.includes(c.iid));
  }
  if (addCards.length) {
    save.decklist.push(...addCards);
  }

  save.combat = null;

  if (result === 'lost') {
    save.status = 'lost';
  }

  await save.save();
  res.json(save);
});

module.exports = router;
