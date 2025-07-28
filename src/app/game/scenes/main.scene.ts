import Phaser from "phaser";
import { PlayerUi } from "../classes/PlayerUi";
import { Monster } from "../classes/Monster";
import { Card } from "../classes/Card";

export class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
    }

    create() {
        new PlayerUi(this);

        const monster = new Monster(this, 650, 100, '', 30);

        const spacing = 110;
        const startX = this.scale.width / 2 - (spacing * 8) / 2 + spacing / 2;
        const y = this.scale.height - 100;

        for (let i = 0; i < 8; i++) {
            const card = new Card(this, startX + i * spacing, y, `Carte ${i + 1}`);
        }

        const endTurnBtn = this.add.rectangle(650, 500, 120, 40, 0x555555).setInteractive();
        const endTurnText = this.add.text(650, 500, 'Fin de tour', {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);
    }
}