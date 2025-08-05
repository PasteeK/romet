import { MonsterAction } from "../Monster";

export interface MonsterConfig {
    name: string;
    texture: string;
    maxHP: number;
    actions: MonsterAction[];
}

export const MONSTER_DEFINITIONS: MonsterConfig[] = [
    {
        name: 'bluffChips',
        texture: 'bluffChips',
        maxHP: 200,
        actions: [
            { type: 'attack', value: 10, description: 'Attaque' },
            { type: 'defend', value: 10, description: 'Protection' },
            { type: 'attack', value: 15, description: 'Attaque+' },
            { type: 'defend', value: 15, description: 'Protection+' },
        ]
    },
    {
        name: 'arnak',
        texture: 'arnak',
        maxHP: 250,
        actions: [
            { type: 'waiting', value: 0, description: 'Attente' },
            { type: 'waiting', value: 0, description: 'Attente' },
            { type: 'StealPercent', value: 25, description: 'Vole un pourcentage' },
        ]
    }
]