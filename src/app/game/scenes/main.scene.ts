import Phaser from "phaser";
import { PlayerUi } from "../classes/PlayerUi";
import { Monster } from "../classes/Monster";
import { Card } from "../classes/Card";

export class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
    }

    create() {
        this.add.image(this.scale.width / 2, this.scale.height / 2, 'background')
            .setDisplaySize(this.scale.width, this.scale.height)
            .setDepth(-10);

        new PlayerUi(this);

        const monster = new Monster(this, 1600, 100, '', 30);

        const spacing = 120;
        const startX = this.scale.width / 2 - (spacing * 8) / 2 + spacing / 2;
        const y = this.scale.height - 100;

        const playZone = this.add.rectangle(this.scale.width /2, this.scale.height - 350, 500, 180, 0x333333, 0.4)
            .setStrokeStyle(2, 0xffffff);
        playZone.name = 'playZone';

        for (let i = 0; i < 8; i++) {
            const card = new Card(this, startX + i * spacing, y, `Carte ${i + 1}`);
        }

        const endTurnBtn = this.add.rectangle(1700, 800, 120, 40, 0x555555).setInteractive();
        const endTurnText = this.add.text(1700, 800, 'Fin de tour', {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);
    }

    preload() {
        this.load.image('background', 'assets/images/fight_background.png')
    }
}