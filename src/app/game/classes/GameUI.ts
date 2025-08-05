import Phaser from 'phaser';
import { GameUIStat } from './GameUIStat';

export class GameUI {
    private floorBox: GameUIStat;
    private hpBox: GameUIStat;
    private goldBox: GameUIStat;
    private discardBox: GameUIStat;
    private scoreBox: GameUIStat;

    constructor(scene: Phaser.Scene) {
        this.floorBox = new GameUIStat(scene, 20, 20, 230, 70, 'Etage', '0-1');
        this.hpBox = new GameUIStat(scene, 20, 220, 230, 70, 'Points de vie', '100');
        this.goldBox = new GameUIStat(scene, 20, 320, 110, 70, 'Argent', '0');
        this.discardBox = new GameUIStat(scene, 140, 320, 110, 70, 'Défausse', '0');
        this.scoreBox = new GameUIStat(scene, 20, 120, 230, 70, 'Score', '0');
    }

    setHP(value: number) {
        this.hpBox.setValue(`${value}`);
    }

    setGold(value: number) {
        this.goldBox.setValue(`${value}`);
    }

    setDiscard(value: number) {
        this.discardBox.setValue(`${value}`);
    }

    setScore(label: string, value: number) {
        this.scoreBox.setValue(`${label} ${value}`);
    }

    setFloor(value: number) {
        this.floorBox.setValue(`${value}`);
    }
}
