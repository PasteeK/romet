import Phaser from 'phaser';
import { Card } from './Card';
import { count } from 'rxjs';
import { GameUI } from './GameUI';

export class PlayZone {
    private scene: Phaser.Scene;
    private zone: Phaser.GameObjects.Rectangle;
    private cards: Card[] = [];
    private maxCards = 5;
    private cardSpacing = 120;
    private lastScore: number = 0;

    private gameUI?: GameUI
    public setGameUI(ui: GameUI) {
        this.gameUI = ui;
    }

    private onChangeCallback?: () => void;
    private onCardRemovedCallback?: (card: Card) => void;

    public setOnCardRemoved(cb: (card: Card) => void): void {
        this.onCardRemovedCallback = cb;
    }


    constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
        this.scene = scene;

        this.zone = scene.add.rectangle(x, y, width, height, 0x333333, 0.4)
            .setStrokeStyle(2, 0xD6A858)
            .setDepth(-1)
            .setName('playZone');
    }

    isInside(x: number, y: number): boolean {
        return Phaser.Geom.Rectangle.Contains(this.zone.getBounds(), x, y);
    }

    canAcceptCard(): boolean {
        return this.cards.length < this.maxCards;
    }

    addCard(card: Card): void {
        if (!this.canAcceptCard()) return;

        const index = this.cards.length;
        const startX = this.zone.x - ((this.maxCards - 1) * this.cardSpacing) / 2;
        const targetX = startX + index * this.cardSpacing;
        const targetY = this.zone.y;

        card.setPosition(targetX, targetY);
        card.setDepth(1);
        this.scene.input.setDraggable(card, false);
        this.cards.push(card);

        card.setInteractive();
        card.once('pointerdown', () => {
            this.removeCard(card);
        });
        if (this.onChangeCallback) this.onChangeCallback();
    }

    removeCard(card: Card): void {
        const index = this.cards.indexOf(card);
        if (index === -1) return;

        this.cards.splice(index, 1);

        this.scene.input.setDraggable(card, true);
        card.resetPosition();

        this.repositionCards();

        if (this.onChangeCallback) this.onChangeCallback();
        if (this.onCardRemovedCallback) this.onCardRemovedCallback(card);
    }

    private repositionCards(): void {
        const startX = this.zone.x - ((this.maxCards - 1) * this.cardSpacing) / 2;
        this.cards.forEach((card, i) => {
            const x = startX + i * this.cardSpacing;
            const y = this.zone.y;
            card.setPosition(x, y);
        });
    }

    containsCard(card: Card): boolean {
        return this.cards.includes(card);
    }

    getCardCount(): number {
        return this.cards.length;
    }

    evaluateHand(): string {
        if (this.cards.length < 1) return '';

        const valueMap: { [key: string]: number } = {
            '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
            '7': 7, '8': 8, '9': 9, '10': 10,
            'J': 11, 'Q': 12, 'K': 13, 'A': 14
        };

        const values = this.cards.map(card => valueMap[card.value]);
        const suits = this.cards.map(card => card.suit);

        const counts: { [val: number]: number } = {};
        values.forEach(v => counts[v] = (counts[v] || 0) + 1);
        const countValues = Object.values(counts).sort((a, b) => b - a);
        const uniqueCounts = countValues.join('');

        const sortedValues = [...new Set(values)].sort((a, b) => a - b);

        const isFlush = this.cards.length === 5 && suits.every(suit => suit === suits[0]);

        let isStraight = false;
        if (this.cards.length === 5) {
            // Suite classique
            for (let i = 0; i <= sortedValues.length - 5; i++) {
                const slice = sortedValues.slice(i, i + 5);
                if (slice.every((v, j, arr) => j === 0 || v === arr[j - 1] + 1)) {
                    isStraight = true;
                    break;
                }
            }

            // Petite Suite (A-2-3-4-5)
            const wheel = [14, 2, 3, 4, 5];
            if (wheel.every(v => values.includes(v))) {
                isStraight = true;
            }
        }

        let handType = 'Carte Haute';
        let multiplier = 1;

        // Main de 5 cartes
        if (this.cards.length === 5) {
            if (isFlush && isStraight && sortedValues.includes(10)) {
                handType = 'Quinte Flush Royale';
                multiplier = 10;
            } else if (isFlush && isStraight) {
                handType = 'Quinte Flush';
                multiplier = 8;
            } else if (uniqueCounts === '41') {
                handType = 'Carré';
                multiplier = 7;
            } else if (uniqueCounts === '32') {
                handType = 'Full';
                multiplier = 6;
            } else if (isFlush) {
                handType = 'Couleur';
                multiplier = 5;
            } else if (isStraight) {
                handType = 'Suite';
                multiplier = 4;
            } else if (uniqueCounts === '311') {
                handType = 'Brelan';
                multiplier = 3;
            } else if (uniqueCounts === '221') {
                handType = 'Double Paire';
                multiplier = 2;
            } else if (uniqueCounts === '2111') {
                handType = 'Paire';
                multiplier = 1.5;
            }
        }

        // Main de 4 cartes
        else if (this.cards.length === 4) {
            if (uniqueCounts === '4') {
                handType = 'Carré';
                multiplier = 7;
            } else if (uniqueCounts === '31') {
                handType = 'Brelan';
                multiplier = 3;
            } else if (uniqueCounts === '22') {
                handType = 'Double Paire';
                multiplier = 2;
            } else if (uniqueCounts === '211') {
                handType = 'Paire';
                multiplier = 1.5;
            }
        }

        // Main de 3 cartes
        else if (this.cards.length === 3) {
            if (uniqueCounts === '3') {
                handType = 'Brelan';
                multiplier = 3;
            } else if (uniqueCounts === '21') {
                handType = 'Paire';
                multiplier = 1.5;
            }
        }

        // Main de 2 cartes
        else if (this.cards.length === 2) {
            if (uniqueCounts === '2') {
                handType = 'Paire';
                multiplier = 1.5;
            }
        }

        const total = values.reduce((sum, v) => sum + v, 0);
        const score = Math.round(total * multiplier);
        this.lastScore = score;

        if (this.gameUI) {
            this.gameUI.setScore(handType, score);
        }

        return `${handType} - Score : ${score}`;
    }

    clear(): void {
        this.cards.forEach(card => card.destroy());
        this.cards = [];
        this.repositionCards();
        if (this.onChangeCallback) {
            this.onChangeCallback();
        }
    }

    public setOnChangeCallback(cb: () => void) {
        this.onChangeCallback = cb;
    }

    public getCards(): Card[] {
        return [...this.cards];
    }

    public getScore(): number {
        return this.lastScore;
    }
}
