import Phaser from "phaser";
import { PlayerUi } from "../classes/PlayerUi";
import { Monster } from "../classes/Monster";
import { Card } from "../classes/Card";
import { PlayZone } from "../classes/PlayZone";

export class MainScene extends Phaser.Scene {
    private playZone!: PlayZone;

    constructor() {
        super('MainScene');
    }

    preload() {
        // Chargement des images de fond
        this.load.image('background', 'assets/images/fight_background.png');
        this.load.image('tapis', 'assets/images/tapis_bg.png');
        this.load.image('ui_bg', 'assets/images/ui_bg.png');

        // Chargement des cartes
        const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        values.forEach(value => {
            this.load.image(`diamond_${value}`, `assets/cards/diamond_${value}.svg`);
            this.load.image(`heart_${value}`, `assets/cards/diamond_${value}.svg`);
            this.load.image(`spade_${value}`, `assets/cards/diamond_${value}.svg`);
            this.load.image(`clubs_${value}`, `assets/cards/diamond_${value}.svg`);
        });

        // Chargement des monstres
        this.load.image('bluffChips', 'assets/monsters/sprites/bluffChips.png');
    }

    create() {
        // Ajout des images de fond
        this.add.image(785, 0, 'background')
            .setOrigin(0.5, 0)
            .setDisplaySize(this.scale.width / 1.25, this.scale.height / 1.42)
            .setDepth(-10);

        this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'tapis')
            .setDisplaySize(this.scale.width * 2, this.scale.height * 2)
            .setDepth(-12);

        this.add.image(0, 0, 'ui_bg')
            .setOrigin(0.5)
            .setScale(1.25, 1.5);

        this.add.rectangle(800, 505, this.scale.width / 2 + 380, 12, 0xF7803C);

        // Ajout de l'UI
        new PlayerUi(this);

        // Ajout du monstre
        const monster = new Monster(this, this.scale.width - 150, 300, 'bluffChips', 30).setScale(1.75);

        // Ajout du PlayZone
        this.playZone = new PlayZone(this, this.scale.width / 2 + 25, this.scale.height - 350, 700, 180);

        // Ajout des cartes
        const cardValues = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        const spacing = 120;
        const startX = this.scale.width / 3 - spacing / 2;
        const y = this.scale.height - 100;

        for (let i = 0; i < 8; i++) {
            const card = new Card(this, startX + i * spacing, y, cardValues[i], 'diamond');

            card.on('pointerdown', () => {
                if (this.playZone.isInside(card.x, card.y)) return;

                if (this.playZone.canAcceptCard()) {
                    (card as Card).wasClicked = true;
                    this.playZone.addCard(card);
                } else {
                    console.log('PlayZone pleine !');
                }
            });
        }

        // Drag and drop
        this.input.on('dragstart', (_: Phaser.Input.Pointer, gameObject: Card) => {
            gameObject.setDepth(1000);
        });

        this.input.on('drag', (_: Phaser.Input.Pointer, gameObject: Card, dragX: number, dragY: number) => {
            gameObject.x = dragX;
            gameObject.y = dragY;
        });

        this.input.on('dragend', (_: Phaser.Input.Pointer, gameObject: Card) => {
            if (gameObject.wasClicked) {
                gameObject.wasClicked = false; // le clic a déjà géré le placement
                return;
            }

            gameObject.setDepth(0);

            if (this.playZone.isInside(gameObject.x, gameObject.y)) {
                if (this.playZone.canAcceptCard()) {
                    this.playZone.addCard(gameObject);
                } else {
                    console.log("PlayZone pleine !");
                    gameObject.resetPosition();
                }
            } else {
                gameObject.resetPosition();
            }
        });

        // Bouton de fin de tour
        const endTurnBtn = this.add.rectangle(1700, 800, 120, 40, 0x555555).setInteractive();
        const endTurnText = this.add.text(1700, 800, 'Fin de tour', {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);
    }
}
