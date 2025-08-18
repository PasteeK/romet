const mongoose = require('mongoose');
const { Schema } = mongoose;

const CardInstanceSchema = new Schema({
  iid: { type: String, required: true },
  cardId: { type: String, required: true },
  upgrades: { type: Number, default: 0 },
  modifiers: [{ type: String, default: [] }]
}, { _id: false });

const PileSchema = new Schema({
  cards: { type: [CardInstanceSchema], default: [] }
}, { _id: false });

const StatusEffectSchema = new Schema({
  name: { type: String, required: true },
  stacks: { type: Number, default: 0 }
}, { _id: false });

const MonsterStateSchema = new Schema({
  monsterId: { type: String, required: true },
  hp: { type: Number, required: true },
  maxHp: { type: Number, required: true },
  block: { type: Number, default: 0 },
  intents: { type: String, default: '' },
  buffs: { type: [StatusEffectSchema], default: [] }
}, { _id: false });

const CombatStateSchema = new Schema({
  encounterId: { type: String, required: true },
  rngSeed: { type: Number, required: true },
  turn: { type: Number, default: 1 },
  playerBlock: { type: Number, default: 0 },
  playerEffects: { type: [StatusEffectSchema], default: [] },
  monsters: { type: [MonsterStateSchema], default: [] },
  draw: PileSchema,
  hand: PileSchema,
  discard: PileSchema,
  exhaust: PileSchema
}, { _id: false });

const MapNodeSchema = new Schema({
  id: { type: String, required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  type: { 
    type: String, 
    enum: ['start','fight','elite','shop','smoking','cheater','boss'], 
    required: true 
  },
  neighbors: { type: [String], default: [] },
  state: { type: String, enum: ['locked','available','cleared'], default: 'locked' }
}, { _id: false });

const ShopStateSchema = new Schema({
  items: [{
    itemId: String,
    price: Number,
    sold: { type: Boolean, default: false }
  }],
  rerollsLeft: { type: Number, default: 0 }
}, { _id: false });

const SavegameSchema = new Schema({
  player: { type: Schema.Types.ObjectId, ref: 'Player', index: true, required: true },

  status: { type: String, enum: ['in_progress','won','lost','abandoned'], default: 'in_progress' },
  difficulty: { type: String, enum: ['easy','normal','hard'], default: 'normal' },
  seed: { type: Number, required: true },

  floor: { type: Number, default: 1 },
  mapNodes: { type: [MapNodeSchema], default: [] },
  currentNodeId: { type: String, required: true },
  pathTaken: { type: [String], default: [] },

  playerState: {
    hp: { type: Number, required: true },
    maxHp: { type: Number, required: true },
    gold: { type: Number, default: 0 },
    energyMax: { type: Number, default: 3 },
    relics: [{ type: String, default: [] }],
    potions: [{ type: String, default: [] }]
  },

  decklist: { type: [CardInstanceSchema], default: [] },

  drawOrder: { type: [String], default: [] },
  discardOrder: { type: [String], default: [] },
  exhaustOrder: { type: [String], default: [] },

  combat: { type: CombatStateSchema, default: null },
  shop: { type: ShopStateSchema, default: null },

  clientTick: { type: Number, default: 0 }
}, { timestamps: true });

SavegameSchema.index({ player: 1, status: 1, updatedAt: -1 });

module.exports = mongoose.model('Savegame', SavegameSchema);
