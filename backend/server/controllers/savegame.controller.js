const Savegame = require('../schemas/Savegame');
const Player   = require('../schemas/Player');

// GET /savegames/current
async function getCurrent(_req, res) {
  const save = await Savegame.findOne({}).sort({ updatedAt: -1 }).lean();
  if (!save) return res.status(204).send();
  res.json(save);
}

// POST /savegames/start
async function start(req, res) {
  try {
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

    // Incrémente gamesPlayed si un joueur est attaché (JWT / session)
    const playerId = req.user?.id || req.user?._id || req.headers['x-player-id'];
    if (playerId) {
      await Player.findByIdAndUpdate(
        playerId,
        { $inc: { gamesPlayed: 1 }, $set: { savegame: save._id } },
        { new: true }
      ).lean();
    }

    res.status(201).json(save);
  } catch (e) {
    console.error('start error:', e);
    res.status(500).json({ error: e?.message || 'Internal Server Error' });
  }
}

// PATCH /savegames/:id/move
async function move(req, res) {
  const { id } = req.params;
  const { targetNodeId, clientTick } = req.body;

  const save = await Savegame.findById(id);
  if (!save) return res.status(404).json({ error: 'save not found' });

  if (save.combat && save.combat.status === 'active' && !save.combat.finished && !save.combat.ended) {
    return res.status(400).json({ error: 'combat already active' });
  }

  const cur = save.mapNodes.find(n => n.id === save.currentNodeId);
  if (!cur || !cur.neighbors.includes(targetNodeId)) {
    return res.status(400).json({ error: 'target not reachable' });
  }

  const curIdx = save.mapNodes.findIndex(n => n.id === save.currentNodeId);
  if (curIdx >= 0) save.mapNodes[curIdx].state = 'cleared';

  save.currentNodeId = targetNodeId;

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
}

// POST /savegames/:id/combat/start
async function combatStart(req, res) {
  const { id } = req.params;
  const {
    encounterId,
    rngSeed,
    monsters = [],
    encounterType = 'normal'   // ← IMPORTANT: on lit bien depuis le body
  } = req.body;

  const save = await Savegame.findById(id);
  if (!save) return res.status(404).json({ error: 'save not found' });

  if (save.combat && save.combat.status === 'active' && !save.combat.finished && !save.combat.ended) {
    return res.status(400).json({ error: 'combat already active' });
  }

  save.combat = {
    id: encounterId,
    rngSeed,
    monsters,
    status: 'active',
    ended: false,
    finished: false,
    finishedAt: null,
    result: '',
    encounterType
  };

  await save.save();
  res.json(save);
}

// POST /savegames/:id/combat/end
async function combatEnd(req, res) {
  const { id } = req.params;
  const { result, playerHp, goldDelta = 0 } = req.body;

  const save = await Savegame.findById(id);
  if (!save) return res.status(404).json({ error: 'save not found' });

  if (typeof playerHp === 'number') {
    save.playerHp = playerHp;
    save.currentHp = playerHp;
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
}

async function patch(req, res) {
  const { id } = req.params;
  const { playerHp, gold, maxHp } = req.body || {};

  const save = await Savegame.findById(id);
  if (!save) return res.status(404).send({ message: 'Save not found' });

  if (typeof playerHp === 'number') save.playerHp = playerHp;
  if (typeof gold === 'number') save.gold = gold;
  if (typeof maxHp === 'number') save.maxHp = maxHp;

  await save.save();
  res.json(save);
}

module.exports = { getCurrent, start, move, combatStart, combatEnd, patch };
