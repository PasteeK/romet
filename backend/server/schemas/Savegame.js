const mongoose = require('mongoose');

// Schéma d'un evenement sur la carte, dans la base de données
const MapNodeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  x: Number, y: Number,
  type: { type: String, default: 'fight' },
  neighbors: { type: [String], default: [] },
  state: { type: String, enum: ['locked', 'available', 'cleared'], default: 'locked' }
}, { _id: false });

// Schéma de l'evenement combat, dans la base de données
const CombatSchema = new mongoose.Schema({
  id: String,
  rngSeed: Number,
  monsters: { type: Array, default: [] },
  status: { type: String, default: 'active' }, // 'active' | 'finished'
  ended: { type: Boolean, default: false },
  finished: { type: Boolean, default: false },
  finishedAt: { type: Date, default: null },
  result: { type: String, default: '' },
  encounterType: { type: String, enum: ['normal', 'elite', 'boss'], default: 'normal' },
}, { _id: false });

// Schéma d'une partie, dans la base de données
const SavegameSchema = new mongoose.Schema({
  seed: Number,
  difficulty: { type: String, default: 'normal' },
  mapNodes: { type: [MapNodeSchema], default: [] },
  startNodeId: { type: String, default: 'start' },
  currentNodeId: { type: String, default: 'start' },

  startingHp: { type: Number, default: 100 },
  maxHp: { type: Number, default: 100 },
  playerHp: { type: Number, default: 100 },
  currentHp: { type: Number, default: 100 },

  gold: { type: Number, default: 0 },
  combat: { type: CombatSchema, default: null },
  clientTick: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Savegame', SavegameSchema);
