import { MonsterActionType, MonsterAction } from "../Monster";

export type SoundRef =
  | string // clé audio simple (ex: "sfx_hit1")
  | { key: string; volume?: number; rate?: number; detune?: number }; // options Phaser facultatives

export type SoundSet = SoundRef | SoundRef[];

export interface MonsterSounds {
  /** Joué à l'apparition du monstre */
  spawn?: SoundSet;
  /** Joué quand le monstre exécute une action : action-type -> sons */
  action?: Partial<Record<MonsterActionType, SoundSet>>;
  /** Joué quand le monstre prend un dégât (après absorption bouclier, si > 0) */
  hit?: SoundSet;
  /** Joué quand le monstre meurt */
  death?: SoundSet;
}

export interface BaseMonsterConfig {
  name: string;
  texture: string;
  maxHP: number;
  actions: MonsterAction[];
  goldReward: { min: number; max: number } | number;
  actionsPerTurn?: number;
  /** Déclarations de sons pour ce monstre (optionnel) */
  sounds?: MonsterSounds;
}