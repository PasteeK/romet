import { BaseMonsterConfig } from "./types";

// Récupérer la configuration des monstres
export interface MonsterConfig extends BaseMonsterConfig {}

// Définition des monstres basiques
export const MONSTER_DEFINITIONS: MonsterConfig[] = [
    // Jeton Bluffer
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
            min: 1,
            max: 4
        }
    },

    // Arnak
    {
        name: 'arnak',
        texture: 'arnak',
        maxHP: 400,
        actionsPerTurn: 2,
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
            min: 3,
            max: 6
        }
    },

    // Paire Moisie
    {
        name: 'lowRollers',
        texture: 'lowRollers',
        maxHP: 300,
        actionsPerTurn: 2,
        actions: [
            { type: 'attack', value: 15, description: 'Attaque' },
            { type: 'defend', value: 15, description: 'Protection' },
        ],
        goldReward: {
            min: 2,
            max: 2
        }
    },

    // Roulette démoniaque
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
            min: 1,
            max: 5
        },
    },


    
    // COLLABORATIONS

    // Maccaroni : Collaboration avec Gael de numerica
    // {
    //     name: 'maccaroni',
    //     texture: 'maccaroni',
    //     maxHP: 350,
    //     actions: [
    //         { type: 'combo', value: 0, description: 'PROJEEET', delayMs: 10, steps: [
    //             { type: 'transform', value: 2, description: 'PROJET' },
    //             { type: 'attack', value: 5, description: 'Attaque' },
    //             { type: 'transform', value: 0, description: 'PluPROJET' },

    //             { type: 'transform', value: 2, description: 'PROJET' },
    //             { type: 'attack', value: 5, description: 'Attaque' },
    //             { type: 'transform', value: 0, description: 'PluPROJET' },

    //             { type: 'transform', value: 2, description: 'PROJET' },
    //             { type: 'attack', value: 5, description: 'Attaque' },
    //             { type: 'transform', value: 0, description: 'PluPROJET' },

    //             { type: 'transform', value: 2, description: 'PROJET' },
    //             { type: 'attack', value: 5, description: 'Attaque' },
    //             { type: 'transform', value: 0, description: 'PluPROJET' }
    //         ]},
    //         { type: 'StealPercent', value: 20, description: 'impots' },
    //     ],
    //     goldReward: {
    //         min: 3,
    //         max: 5
    //     },
    //     actionsPerTurn: 1,
    //     sounds: {
    //         // spawn: 'sfx_maccaroni_spawn',
    //         action: {
    //             attack: 'sfx_maccaroni_attack',
    //         },
    //         death: 'sfx_maccaroni_death',
    //         hit: 'sfx_maccaroni_hit'
    //     }
    // },

    // Pilote Raccoon : Collaboratio indirecte avec Julien de numerica
    // {
    //     name: 'piloteRaccoon',
    //     texture: 'piloteRaccoon',
    //     maxHP: 450,
    //     actions: [
    //         { type: 'attack', value: 5, description: 'TA !' },
    //     ],
    //     goldReward: {
    //         min: 2,
    //         max: 5
    //     },
    //     actionsPerTurn: 1,
    //     sounds: {
    //         spawn: 'sfx_piloteRaccoon_spawn',
    //         // action: {
    //         //     attack: 'sfx_piloteRaccoon_attack',
    //         // },
    //         hit: ['sfx_piloteRaccoon_hit1', 
    //             'sfx_piloteRaccoon_hit2', 
    //             'sfx_piloteRaccoon_hit3',
    //             'sfx_piloteRaccoon_hit4',
    //             'sfx_piloteRaccoon_hit5',
    //             'sfx_piloteRaccoon_hit6',
    //             'sfx_piloteRaccoon_hit7',
    //             'sfx_piloteRaccoon_hit8',
    //             'sfx_piloteRaccoon_hit9',
    //             'sfx_piloteRaccoon_hit10'],
    //     }
    // },

    // Laitka : Collaboration avec Luka de numerica
    // {
    //     name: 'laitka',
    //     texture: 'laitka',
    //     maxHP: 250,
    //     actions: [
    //         { type: 'attack', value: 10, description: 'ATCHOUM' },
    //         { type: 'milk', value: 50, description: 'MILK' },
    //     ],
    //     goldReward: {
    //         min: 1,
    //         max: 4
    //     },
    //     actionsPerTurn: 1,
    //     sounds: {
    //         spawn: 'sfx_laitka_spawn',
    //         action: {
    //             attack: 'sfx_laitka_attack',
    //             milk: 'sfx_laitka_milk',
    //         },
    //         hit: 'sfx_laitka_hit',
    //         death: 'sfx_laitka_death'
    //     }
    // }
]