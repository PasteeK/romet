import { MonsterActionType, MonsterAction } from "../Monster";

// Clé audio gérée par Phaser
export type SoundRef =
  | string // (memo perso : "sfx_hit1")
  | { key: string; volume?: number; rate?: number; detune?: number };

export type SoundSet = SoundRef | SoundRef[];

// Interface de configuration des sons du monstres lorsqu'il fait une action
export interface MonsterSounds {
  // Joué à l'apparition du monstre
  spawn?: SoundSet;
  // Joué quand le monstre exécute une action
  action?: Partial<Record<MonsterActionType, SoundSet>>;
  // Joué quand le monstre prend un dégât
  hit?: SoundSet;
  // Joué quand le monstre meurt
  death?: SoundSet;
}

// Configuration de base d'un monstre
export interface BaseMonsterConfig {
  name: string;
  texture: string;
  maxHP: number;
  actions: MonsterAction[];
  goldReward: { min: number; max: number } | number;
  actionsPerTurn?: number;
  sounds?: MonsterSounds;
}