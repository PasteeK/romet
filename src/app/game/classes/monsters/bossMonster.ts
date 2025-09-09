import { MonsterAction } from "../Monster";
import { MonsterSounds } from "./types";

export interface BossConfig {
  name: string;
  texture: string;
  maxHP: number;
  actionsPerTurn?: number;
  actions: MonsterAction[];
  goldReward: { min: number; max: number };
  sounds?: MonsterSounds
}

export const BOSS_DEFINITIONS: BossConfig[] = [
  {
    name: "spadeBoss",
    texture: "spadeBoss",
    maxHP: 750,
    actionsPerTurn: 2,
    actions: [
      { type: "attack", value: 20, description: "Coup du parrain" },
      { type: "defend", value: 15, description: "Cigar Shield" },
      { type: "attack", value: 30, description: "Assaut de pique" },
      { type: "waiting", value: 0, description: "Regard menaçant" },
      { type: "StealPercent", value: 20, description: "Ratisse le tapis (20%)" },
      { type: "waiting", value: 0, description: "Regard menaçant" },
    ],
    goldReward: { min: 150, max: 250 },
  },
];
