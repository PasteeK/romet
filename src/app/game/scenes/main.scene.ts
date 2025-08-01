import Phaser from "phaser";
import { PlayerUi } from "../classes/PlayerUi";
import { Monster } from "../classes/Monster";
import { Card } from "../classes/Card";
import { PlayZone } from "../classes/PlayZone";
import { BtnEndTurn } from "../classes/BtnEndTurn";

export class MainScene extends Phaser.Scene {
    private playZone!: PlayZone;
    private resultText!: Phaser.GameObjects.Text;
    private handCards: Card[] = [];

    constructor() {
        super('MainScene');
    }

    private tryPlayCard(card: Card) {
        if (this.playZone.containsCard(card)) return;

        if (this.playZone.canAcceptCard()) {
            this.playZone.addCard(card);
            this.resultText.setText(this.playZone.evaluateHand());

            const index = this.handCards.indexOf(card);
            if (index !== -1) {
                this.handCards.splice(index, 1);
            }

            this.reorganizeHand();
        } else {
            console.log("PlayZone pleine !");
            card.resetPosition();
        }
    }

    private reorganizeHand() {
        const spacing = 120;
        const startX = this.scale.width / 3 - spacing / 2;
        const y = this.scale.height - 100;

        this.handCards.forEach((card, i) => {
            const x = startX + i * spacing;
            card.setPosition(x, y);
            card.setOriginalPosition(x, y);
        });
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

        // Ajout du Monstre
        new Monster(this, this.scale.width - 150, 285, 'bluffChips', 30).setScale(1.75);

        // Ajout de la PlayZone
        this.playZone = new PlayZone(this, this.scale.width / 2 + 25, this.scale.height - 335, 700, 180);
        this.playZone.setOnChangeCallback(() => {
            this.resultText.setText(this.playZone.evaluateHand());
            const cardCount = this.playZone.getCardCount();
            endTurnButton.setEnabled(cardCount === 5);
        })

        const suits = ['diamond', 'heart', 'spade', 'clubs'];
        const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        const fulldeck = Phaser.Utils.Array.Shuffle(suits.flatMap(suit =>
            values.map(value => ({ suit, value }))
        ));
        const hand = fulldeck.slice(0, 8);

        const spacing = 120;
        const startX = this.scale.width / 3 - spacing / 2;
        const y = this.scale.height - 100;

        for (let i = 0; i < hand.length; i++) {
            const { suit, value } = hand[i];
            const x = startX + i * spacing;
            const card = new Card(this, x, y, value, suit);
            card.setOriginalPosition(x, y);
            this.handCards.push(card);

            card.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                const downX = pointer.x, downY = pointer.y;
                card.once('pointerup', (upPointer: Phaser.Input.Pointer) => {
                    const dist = Phaser.Math.Distance.Between(downX, downY, upPointer.x, upPointer.y);
                    if (dist < 10 && !this.playZone.isInside(upPointer.x, upPointer.y)) {
                        this.tryPlayCard(card);
                    }
                });
            });
        }

        this.resultText = this.add.text(this.scale.width / 2, 150, '', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // ✅ Bouton fin de tour
        const endTurnButton = new BtnEndTurn(this, this.scale.width - 150, this.scale.height - 280);
        endTurnButton.setEnabled(false);
        endTurnButton.onClick(() => {
            this.playZone.clear();

            // 🔄 Vérifie la main actuelle
            const currentHandSize = this.handCards.length;
            const needed = 8 - currentHandSize;

            if (needed > 0) {
                const deck = suits.flatMap(suit => values.map(value => ({ suit, value })));
                const used = this.handCards.map(c => `${c.suit}_${c.value}`);
                const remaining = Phaser.Utils.Array.Shuffle(deck.filter(c => !used.includes(`${c.suit}_${c.value}`)));

                for (let i = 0; i < needed; i++) {
                    const { suit, value } = remaining[i];
                    const card = new Card(this, 0, 0, value, suit); // pos temporaire
                    this.handCards.push(card);

                    card.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                        const downX = pointer.x, downY = pointer.y;
                        card.once('pointerup', (upPointer: Phaser.Input.Pointer) => {
                            const dist = Phaser.Math.Distance.Between(downX, downY, upPointer.x, upPointer.y);
                            if (dist < 10 && !this.playZone.isInside(upPointer.x, upPointer.y)) {
                                this.tryPlayCard(card);
                            }
                        });
                    });
                }

                this.reorganizeHand(); // ✅ repositionne toute la main
            }

            endTurnButton.setEnabled(false); // désactive jusqu'à prochaine main complète
        });

        // ✅ Callback sur modification de la zone de jeu
        this.playZone.setOnChangeCallback(() => {
            this.resultText.setText(this.playZone.evaluateHand());
            endTurnButton.setEnabled(this.playZone.getCardCount() === 5);
        });
    }
}