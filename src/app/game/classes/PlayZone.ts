import Phaser from 'phaser';
import { Card } from './Card';

export class PlayZone {
    private scene: Phaser.Scene;
    private zone: Phaser.GameObjects.Rectangle;
    private cards: Card[] = [];
    private maxCards = 5;
    private cardSpacing = 120;

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
    }

    removeCard(card: Card): void {
        const index = this.cards.indexOf(card);
        if (index === -1) return;

        this.cards.splice(index, 1);

        this.scene.input.setDraggable(card, true);

        card.resetPosition();

        this.repositionCards();
    }

    private repositionCards(): void {
        const startX = this.zone.x - ((this.maxCards - 1) * this.cardSpacing) / 2;
        this.cards.forEach((card, i) => {
            const x = startX + i * this.cardSpacing;
            const y = this.zone.y;
            card.setPosition(x, y);
        });
    }

    getCardCount(): number {
        return this.cards.length;
    }
}
