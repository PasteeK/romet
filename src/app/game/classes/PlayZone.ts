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
        const cards = this.cards;

        if (cards.length < 5) return '';

        const values = cards.map(card => card.getValue());
        const suits = cards.map(card => card.getSuit());

        const numericValues = values.map(val => {
            if (val === 'A') return 14;
            if (val === 'K') return 13;
            if (val === 'Q') return 12;
            if (val === 'J') return 11;
            return parseInt(val);
        }).sort((a, b) => a - b);

        const isFlush = suits.every(s => s === suits[0]);
        const isStraight = numericValues.every((val, i, arr) => 
        i === 0 || val === arr[i - 1] + 1
        );

        const counts: Record<number, number> = {};
        numericValues.forEach(v => counts[v] = (counts[v] || 0) + 1);

        const countValues = Object.values(counts)

        if (isStraight && isFlush) return 'Quinte Flush';
        if (countValues.includes(4)) return 'Carré';
        if (countValues.includes(3) && countValues.includes(2)) return 'Full';
        if (isFlush) return 'Couleur';
        if (isStraight) return 'Suite';
        if (countValues.includes(3)) return 'Brelan';
        if (countValues.filter(c => c === 2).length === 2) return 'Deux paires';
        if (countValues.includes(2)) return 'Paire';

        return 'Carte Haute';
    }

    setOnChangeCallback(cb: () => void) {
        this.onChangeCallback = cb;
    }

}
