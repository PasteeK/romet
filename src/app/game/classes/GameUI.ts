import Phaser from 'phaser';
import { GameUIStat } from './GameUIStat';

// Gestion de l'UI du jeu
export class GameUI {
    // variables
    private floorBox: GameUIStat;
    private hpBox: GameUIStat;
    private goldBox: GameUIStat;
    private discardBox: GameUIStat;
    private scoreBox: GameUIStat;

    constructor(scene: Phaser.Scene) {
        // Statistiques à gauche de l'écran
        this.floorBox = new GameUIStat(scene, 20, 20, 230, 70, 'Etage', '0-1');
        this.hpBox = new GameUIStat(scene, 20, 220, 230, 70, 'Points de vie', '100');
        this.goldBox = new GameUIStat(scene, 20, 320, 110, 70, 'Argent', '0');
        this.discardBox = new GameUIStat(scene, 140, 320, 110, 70, 'Défausse', '0');
        this.scoreBox = new GameUIStat(scene, 20, 120, 230, 70, 'Score', '0');
    }

    // Set les points de vie du joueur
    setHP(value: number) {
        this.hpBox.setValue(`${value}`);
    }

    // Set l'or du joueur
    setGold(value: number) {
        this.goldBox.setValue(`${value}`);
    }

    // Set le nombres de défausses du joueur
    setDiscard(value: number) {
        this.discardBox.setValue(`${value}`);
    }

    // Set le score du joueur
    setScore(label: string, value: number) {
        this.scoreBox.setValue(`${label} ${value}`);
    }

    // Set l'endoit du joueur sur la carte
    setFloor(value: number) {
        this.floorBox.setValue(`${value}`);
    }

    // Récupérer les bords de l'UI (Utile pour les hitbox via Phaser)
    getBounds() {
        return this.floorBox.getBounds();
    }
}
