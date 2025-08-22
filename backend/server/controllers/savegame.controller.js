const Savegame = require('../schemas/Savegame');

// GET /savegames/current
exports.getCurrent = async (_req, res) => {
  const save = await Savegame.findOne({}).sort({ updatedAt: -1 }).lean();
  if (!save) return res.status(204).send();
  res.json(save);
};

// POST /savegames/start
exports.start = async (req, res) => {
  const { seed, difficulty, mapNodes, startNodeId, startingHp, maxHp } = req.body;

  const baseHp = startingHp ?? 100;
  const save = await Savegame.create({
    seed,
    difficulty: difficulty || 'normal',
    mapNodes,
    startNodeId: startNodeId || 'start',
    currentNodeId: startNodeId || 'start',
    startingHp: baseHp,
    maxHp: maxHp ?? 100,
    playerHp: baseHp,
    currentHp: baseHp,
    combat: null,
    clientTick: 0
  });

  res.status(201).json(save);
};

// PATCH /savegames/:id/move
exports.move = async (req, res) => {
  const { id } = req.params;
  const { targetNodeId, clientTick } = req.body;

  const save = await Savegame.findById(id);
  if (!save) return res.status(404).json({ error: 'save not found' });

  // Ne pas bouger si combat actif
  if (save.combat && save.combat.status === 'active' && !save.combat.finished && !save.combat.ended) {
    return res.status(400).json({ error: 'combat already active' });
  }

  const cur = save.mapNodes.find(n => n.id === save.currentNodeId);
  if (!cur || !cur.neighbors.includes(targetNodeId)) {
    return res.status(400).json({ error: 'target not reachable' });
  }

  // current -> cleared
  const curIdx = save.mapNodes.findIndex(n => n.id === save.currentNodeId);
  if (curIdx >= 0) save.mapNodes[curIdx].state = 'cleared';

  // target -> current
  save.currentNodeId = targetNodeId;

  // Débloquer voisins du nouveau current
  const next = save.mapNodes.find(n => n.id === targetNodeId);
  if (next) {
    next.state = 'cleared';
    const allowed = new Set(next.neighbors);
    save.mapNodes.forEach(n => {
      if (n.state !== 'cleared') {
        n.state = allowed.has(n.id) ? 'available' : 'locked';
      }
    });
  }

  save.clientTick = typeof clientTick === 'number' ? clientTick + 1 : (save.clientTick + 1);

  await save.save();
  res.json(save);
};

// POST /savegames/:id/combat/start
exports.combatStart = async (req, res) => {
  const { id } = req.params;
  const { encounterId, rngSeed, monsters } = req.body;

  const save = await Savegame.findById(id);
  if (!save) return res.status(404).json({ error: 'save not found' });

  if (save.combat && save.combat.status === 'active' && !save.combat.finished && !save.combat.ended) {
    return res.status(400).json({ error: 'combat already active' });
  }

  save.combat = {
    id: encounterId,
    rngSeed,
    monsters: monsters || [],
    status: 'active',
    ended: false,
    finished: false,
    finishedAt: null,
    result: ''
  };

  await save.save();
  res.json(save);
};

// POST /savegames/:id/combat/end
exports.combatEnd = async (req, res) => {
  const { id } = req.params;
  const { result, playerHp, goldDelta = 0 } = req.body;

  const save = await Savegame.findById(id);
  if (!save) return res.status(404).json({ error: 'save not found' });

  if (typeof playerHp === 'number') {
    save.playerHp = playerHp;   // ← source de vérité
    save.currentHp = playerHp;  // ← compat si le front le lit encore
  }

  if (!save.combat) save.combat = {};
  save.combat.status = 'finished';
  save.combat.ended = true;
  save.combat.finished = true;
  save.combat.finishedAt = new Date();
  save.combat.result = result || 'won';

  if (goldDelta) save.gold += goldDelta;

  await save.save();
  res.json(save);
};
