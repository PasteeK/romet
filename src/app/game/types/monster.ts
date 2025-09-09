
export type MonsterActionType =
  'attack' |
  'defend' |
  'heal' |
  'buff' |
  'debuff' |
  'waiting' |
  'StealPercent'|
  'doubleAtk' |
  'charm' |
  'transform';
export interface MonsterAction {
  type: MonsterActionType;
  value: number;
  description: string;
}

export type SoundRef = string | { key: string; volume: number };

export type SoundSet = SoundRef | SoundRef[];

export interface MonsterSounds {
  spawn?: SoundSet;
  act?: Partial<Record<MonsterActionType, SoundSet>> | SoundSet;
  hit?: SoundSet;
  death?: SoundSet;
}

export interface BaseMonsterConfig {
  name: string;
  texture: string;
  maxHP: number;
  actionsPerTurn?: number;
  actions: MonsterAction[];
  goldReward: number | { min: number; max: number };
  sounds?: MonsterSounds;
}