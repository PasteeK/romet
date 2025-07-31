import Phaser from "phaser";
import { PlayerUi } from "../classes/PlayerUi";
import { Monster } from "../classes/Monster";
import { Card } from "../classes/Card";
import { PlayZone } from "../classes/PlayZone";

export class MainScene extends Phaser.Scene {
    private playZone!: PlayZone;
    private resultText!: Phaser.GameObjects.Text;

    constructor() {
        super('MainScene');
    }

    private tryPlayCard(card: Card) {
        if (this.playZone.containsCard(card)) return;

        if (this.playZone.canAcceptCard()) {
            this.playZone.addCard(card);
            this.resultText.setText(this.playZone.evaluateHand());
        } else {
            console.log("PlayZone pleine !");
            card.resetPosition();
        }
    }

    preload() {
        this.load.image('background', 'assets/images/fight_background.png');
        this.load.image('tapis', 'assets/images/tapis_bg.png');
        this.load.image('ui_bg', 'assets/images/ui_bg.png');

        const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        values.forEach(value => {
            this.load.image(`diamond_${value}`, `assets/cards/diamond_${value}.svg`);
            this.load.image(`heart_${value}`, `assets/cards/heart_${value}.svg`);
            this.load.image(`spade_${value}`, `assets/cards/spade_${value}.svg`);
            this.load.image(`clubs_${value}`, `assets/cards/clubs_${value}.svg`);
        });

        this.load.image('bluffChips', 'assets/monsters/sprites/bluffChips.png');
    }

    create() {
        // Background
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

        new PlayerUi(this);
        new Monster(this, this.scale.width - 150, 300, 'bluffChips', 30).setScale(1.75);

        this.playZone = new PlayZone(this, this.scale.width / 2 + 25, this.scale.height - 350, 700, 180);
        this.playZone.setOnChangeCallback(() => {
            this.resultText.setText(this.playZone.evaluateHand());
        })

        // Tirage aléatoire
        const suits = ['diamond', 'heart', 'spade', 'clubs'];
        const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

        const fulldeck = suits.flatMap(suit =>
            values.map(value => ({ suit, value }))
        );

        // Mélange Fisher-Yates
        for (let i = fulldeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [fulldeck[i], fulldeck[j]] = [fulldeck[j], fulldeck[i]];
        }

        const hand = fulldeck.slice(0, 8);

        const spacing = 120;
        const startX = this.scale.width / 3 - spacing / 2;
        const y = this.scale.height - 100;

        for (let i = 0; i < hand.length; i++) {
            const { suit, value } = hand[i];
            const x = startX + i * spacing;

            const card = new Card(this, x, y, value, suit);
            card.setOriginalPosition(x, y);

            // Clic uniquement si ce n’est pas un drag
            card.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                const downX = pointer.x;
                const downY = pointer.y;

                card.once('pointerup', (upPointer: Phaser.Input.Pointer) => {
                    const dist = Phaser.Math.Distance.Between(downX, downY, upPointer.x, upPointer.y);
                    if (dist < 10 && !this.playZone.isInside(upPointer.x, upPointer.y)) {
                        this.tryPlayCard(card);
                    }
                });
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

        this.input.on('dragend', (pointer: Phaser.Input.Pointer, gameObject: Card) => {
            gameObject.setDepth(0);

            if (this.playZone.isInside(pointer.x, pointer.y)) {
                this.tryPlayCard(gameObject);
            } else {
                gameObject.resetPosition();
            }
        });

        // Calcul de main
        this.resultText = this.add.text(this.scale.width / 2, 150, '', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Bouton de fin de tour
        this.add.rectangle(1700, 800, 120, 40, 0x555555).setInteractive();
        this.add.text(1700, 800, 'Fin de tour', {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);
    }
}
