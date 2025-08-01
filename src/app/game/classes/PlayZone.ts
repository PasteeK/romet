import Phaser from 'phaser';
import { Card } from './Card';
import { count } from 'rxjs';

export class PlayZone {
    private scene: Phaser.Scene;
    private zone: Phaser.GameObjects.Rectangle;
    private cards: Card[] = [];
    private maxCards = 5;
    private cardSpacing = 120;

    private onChangeCallback?: () => void;


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
        if (this.cards.length !== 5) return '';

        const valueMap: { [key: string]: number} = {
            '2': 2,
            '3': 3,
            '4': 4,
            '5': 5,
            '6': 6,
            '7': 7,
            '8': 8,
            '9': 9,
            '10': 10,
            'J': 11,
            'Q': 12,
            'K': 13,
            'A': 14
        };

        const values = this.cards.map(card => valueMap[card.value]).sort((a, b) => a - b);
        const suits = this.cards.map(card => card.suit);
        const counts: { [val: number]: number } = {};
        values.forEach(v => counts[v] = (counts[v] || 0) + 1);

        const isFlush = suits.every(s => s === suits[0]);
        const isStraight = values.every((v, i, arr) => i === 0 || v === arr[i - 1] + 1);

        let handType = 'Carte Haute';
        let multiplier = 1;

        const uniqueCounts = Object.values(counts).sort((a, b) => b - a).join('');

        if (isFlush && isStraight && values[0] === 10) {
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

        const total = values.reduce((sum, v) => sum + v, 0);
        const score = Math.round(total * multiplier);

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

}
