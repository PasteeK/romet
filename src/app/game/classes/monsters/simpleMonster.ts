import { MonsterAction } from "../Monster";

export interface MonsterConfig {
    name: string;
    texture: string;
    maxHP: number;
    actions: MonsterAction[];
    goldReward: { min: number, max: number };
    actionsPerTurn?: number;
}

export const MONSTER_DEFINITIONS: MonsterConfig[] = [
    {
        name: 'bluffChips',
        texture: 'bluffChips',
        maxHP: 300,
        actions: [
            { type: 'attack', value: 10, description: 'Attaque' },
            { type: 'defend', value: 10, description: 'Protection' },
            { type: 'attack', value: 15, description: 'Attaque+' },
            { type: 'defend', value: 15, description: 'Protection+' },
            { type: 'attack', value: 20, description: 'Attaque++' },
            { type: 'defend', value: 20, description: 'Protection++' },
        ],
        goldReward: {
            min: 10,
            max: 20
        }
    },
    {
        name: 'arnak',
        texture: 'arnak',
        maxHP: 350,
        actions: [
            { type: 'attack', value: 5, description: 'Attaque' },
            { type: 'attack', value: 5, description: 'Attaque' },
            { type: 'StealPercent', value: 25, description: 'Vole un pourcentage' },
            { type: 'waiting', value: 0, description: 'attente' },
            { type: 'waiting', value: 0, description: 'attente' },
            { type: 'attack', value: 50, description: 'Attaque' },
        ],
        goldReward: {
            min: 20,
            max: 30
        }
    },
    {
        name: 'lowRollers',
        texture: 'lowRollers',
        maxHP: 250,
        actions: [
            { type: 'attack', value: 15, description: 'Attaque' },
            { type: 'defend', value: 15, description: 'Protection' },
        ],
        goldReward: {
            min: 10,
            max: 20
        },
        actionsPerTurn: 2
    }
]