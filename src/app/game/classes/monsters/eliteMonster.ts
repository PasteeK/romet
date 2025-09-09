import { MonsterAction } from "../Monster";
import { MonsterSounds } from "./types";

export interface EliteConfig {
  name: string;
  texture: string;
  maxHP: number;
  actionsPerTurn?: number;
  actions: MonsterAction[];
  goldReward: { min: number; max: number };
  sounds?: MonsterSounds;
}

export const ELITE_DEFINITIONS: EliteConfig[] = [
  {
    name: "yunderA",
    texture: "yunderA",
    maxHP: 700,
    actionsPerTurn: 3,
    actions: [
      { type: "charm", value: 1, description: "Charme" },
      { type: "waiting", value: 1, description: "attente" },
      { type: "waiting", value: 1, description: "attente" },

      { type: "charm", value: 1, description: "Charme" },
      { type: "transform", value: 2, description: "Transformation 1" },
      { type: "attack", value: 10, description: "Griffe" },

      { type: "charm", value: 1, description: "Charme" },
      { type: "waiting", value: 1, description: "attente" },
      { type: "waiting", value: 1, description: "attente" },

      { type: "charm", value: 1, description: "Charme" },
      { type: "transform", value: 3, description: "Transformation 2" },
      { type: "attack", value: 25, description: "Griffe" },

      { type: "charm", value: 1, description: "Charme" },
      { type: "attack", value: 15, description: "Double Griffe" },
      { type: "attack", value: 15, description: "Double Griffe" },

      { type: "charm", value: 1, description: "Charme" },
      { type: "attack", value: 15, description: "Double Griffe" },
      { type: "attack", value: 15, description: "Double Griffe" },

      { type: "charm", value: 1, description: "Charme" },
      { type: "attack", value: 15, description: "Double Griffe" },
      { type: "attack", value: 15, description: "Double Griffe" },

      { type: "charm", value: 1, description: "Charme" },
      { type: "attack", value: 15, description: "Double Griffe" },
      { type: "attack", value: 15, description: "Double Griffe" },
    ],
    goldReward: { min: 15, max: 25 },
  },
];
