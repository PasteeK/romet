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
    private usedCards: string[] = [];
    private monster!: Monster;
    private discardedCards: string[] = [];

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

    private findInsertIndex(card: Card): number {
        for (let i = 0; i < this.handCards.length; i++) {
            if (card.x < this.handCards[i].x) {
                return i;
            }
        }
        return this.handCards.length;
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

        // Barre latérale separation entre la main et la zone de jeu
        this.add.rectangle(800, 505, this.scale.width / 2 + 380, 12, 0xF7803C);

        new PlayerUi(this);
        this.monster = new Monster(this, this.scale.width - 150, 285, 'bluffChips', 200).setScale(1.75);

        this.playZone = new PlayZone(this, this.scale.width / 2 + 25, this.scale.height - 335, 700, 180);

        const playButton = new BtnEndTurn(this, this.scale.width - 190, this.scale.height - 280, 'Jouer');
        const discardButton = new BtnEndTurn(this, this.scale.width - 80, this.scale.height - 280, 'Défausser');

        playButton.setEnabled(false);
        discardButton.setEnabled(false);

        this.resultText = this.add.text(this.scale.width / 2, 150, '', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.playZone.setOnChangeCallback(() => {
            this.resultText.setText(this.playZone.evaluateHand());
            const cardCount = this.playZone.getCardCount();
            const enabled = cardCount >= 1 && cardCount <= 5;
            playButton.setEnabled(enabled);
            discardButton.setEnabled(enabled);
        });

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
            card.setInteractive();
            this.input.setDraggable(card, true);
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

        playButton.onClick(() => {
            this.playZone.getCards().forEach(card => {
                const id = `${card.suit}_${card.value}`;
                if (!this.usedCards.includes(id)) {
                    this.usedCards.push(id);
                }
            });

            const result = this.playZone.evaluateHand();
            const scoreMatch = result.match(/Score\s*:\s*(\d+)/);
            const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
            this.monster.takeDamage(score);

            this.playZone.clear();

            const currentHandSize = this.handCards.length;
            const needed = 8 - currentHandSize;

            if (needed > 0) {
                let deck = suits.flatMap(suit => values.map(value => ({ suit, value })));
                const used = this.handCards.map(c => `${c.suit}_${c.value}`).concat(this.usedCards);
                let remaining = deck.filter(c =>
                    !used.includes(`${c.suit}_${c.value}`) &&
                    !this.discardedCards.includes(`${c.suit}_${c.value}`)
                );

                if (remaining.length < needed) {
                    const recycled = this.discardedCards.map(id => {
                        const [suit, value] = id.split('_');
                        return { suit, value };
                    });
                    this.discardedCards = [];
                    remaining = remaining.concat(recycled);
                }

                Phaser.Utils.Array.Shuffle(remaining);

                for (let i = 0; i < needed && i < remaining.length; i++) {
                    const { suit, value } = remaining[i];
                    const card = new Card(this, 0, 0, value, suit);
                    card.setInteractive();
                    this.input.setDraggable(card, true);
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

                this.reorganizeHand();
            }

            playButton.setEnabled(false);
            discardButton.setEnabled(false);
        });


        discardButton.onClick(() => {
            this.playZone.getCards().forEach(card => {
                const id = `${card.suit}_${card.value}`;
                if (!this.discardedCards.includes(id)) {
                    this.discardedCards.push(id);
                }
                card.destroy();
            });

            this.playZone.clear();

            const currentHandSize = this.handCards.length;
            const needed = 8 - currentHandSize;

            if (needed > 0) {
                let deck = suits.flatMap(suit => values.map(value => ({ suit, value })));
                const used = this.handCards.map(c => `${c.suit}_${c.value}`)
                    .concat(this.usedCards)
                    .concat(this.discardedCards);

                let remaining = deck.filter(c => !used.includes(`${c.suit}_${c.value}`));

                if (remaining.length < needed) {
                    const recycled = this.discardedCards.map(id => {
                        const [suit, value] = id.split('_');
                        return { suit, value };
                    });
                    this.discardedCards = [];
                    remaining = remaining.concat(recycled);
                }

                Phaser.Utils.Array.Shuffle(remaining);

                for (let i = 0; i < needed && i < remaining.length; i++) {
                    const { suit, value } = remaining[i];
                    const card = new Card(this, 0, 0, value, suit);
                    card.setInteractive();
                    this.input.setDraggable(card, true);
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

                this.reorganizeHand();
            }

            playButton.setEnabled(false);
            discardButton.setEnabled(false);
        });


        this.playZone.setOnCardRemoved((card: Card) => {
            const insertIndex = this.findInsertIndex(card);
            this.handCards.splice(insertIndex, 0, card);
            this.reorganizeHand();
        });

        this.input.on('dragstart', (_: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
            if (gameObject instanceof Card) {
                gameObject.setDepth(1000);
            }
        });

        this.input.on('drag', (_: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject, dragX: number, dragY: number) => {
            if (gameObject instanceof Card) {
                gameObject.x = dragX;
                gameObject.y = dragY;
            }
        });

        this.input.on('dragend', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
            if (gameObject instanceof Card) {
                gameObject.setDepth(0);
                if (this.playZone.isInside(pointer.x, pointer.y)) {
                    this.tryPlayCard(gameObject);
                } else {
                    gameObject.resetPosition();
                }
            }
        });
    }
}
