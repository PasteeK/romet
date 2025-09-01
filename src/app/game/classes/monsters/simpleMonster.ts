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
        maxHP: 350,
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
        maxHP: 400,
        actions: [
            { type: 'attack', value: 5, description: 'Attaque' },
            { type: 'StealPercent', value: 10, description: 'Vole un pourcentage' },
            { type: 'attack', value: 5, description: 'Attaque' },
            { type: 'StealPercent', value: 15, description: 'Vole un pourcentage' },
            { type: 'waiting', value: 0, description: 'attente' },
            { type: 'attack', value: 50, description: 'Attaque' },
            { type: 'StealPercent', value: 25, description: 'Vole un pourcentage' },
        ],
        goldReward: {
            min: 20,
            max: 30
        },
        actionsPerTurn: 2
    },
    {
        name: 'lowRollers',
        texture: 'lowRollers',
        maxHP: 300,
        actions: [
            { type: 'attack', value: 15, description: 'Attaque' },
            { type: 'defend', value: 15, description: 'Protection' },
        ],
        goldReward: {
            min: 10,
            max: 20
        },
        actionsPerTurn: 2
    },
    {
        name: 'devilRoulette',
        texture: 'devilRoulette',
        maxHP: 350,
        actions: [
            { type: 'attack', value: 5, description: 'Attaque' },
            { type: 'doubleAtk', value: 2, description: "Double l'attaque" },
            { type: 'attack', value: 10, description: 'Attaque' },
            { type: 'doubleAtk', value: 2, description: "Double l'attaque" },
            { type: 'attack', value: 20, description: 'Protection' },
            { type: 'doubleAtk', value: 2, description: "Double l'attaque" },
            { type: 'attack', value: 40, description: 'Protection' },
            { type: 'doubleAtk', value: 2, description: "Double l'attaque" },
            { type: 'attack', value: 80, description: 'Protection' },
            { type: 'doubleAtk', value: 2, description: "Double l'attaque" },
            { type: 'attack', value: 160, description: 'Protection' },
        ],
        goldReward: {
            min: 10,
            max: 20
        },
    },
    {
        name: 'maccaroni',
        texture: 'maccaroni',
        maxHP: 450,
        actions: [
            { type: 'attack', value: 2, description: 'Ils' },
            { type: 'attack', value: 2, description: 'sont' },
            { type: 'attack', value: 2, description: 'dans' },
            { type: 'attack', value: 2, description: 'les' },
            { type: 'attack', value: 2, description: 'villes' },
            { type: 'StealPercent', value: 20, description: 'impots' },
            { type: 'waiting', value: 0, description: 'repos' },
            { type: 'waiting', value: 0, description: 'repos' },
            { type: 'waiting', value: 0, description: 'repos' },
            { type: 'waiting', value: 0, description: 'repos' },
        ],
        goldReward: {
            min: 3,
            max: 49
        },
        actionsPerTurn: 5
    }
]