import Phaser from 'phaser';
import { Card } from './Card';
import { GameUI } from './GameUI';

export class PlayZone {
    private scene: Phaser.Scene;
    private zone: Phaser.GameObjects.Rectangle;
    private cards: Card[] = [];
    private maxCards = 5;
    private cardSpacing = 120;
    private lastScore: number = 0;

    private currentMonsterName: string | null = null;

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

    // Renvoi les cartes qui sont dans la zone
    isInside(x: number, y: number): boolean {
        return Phaser.Geom.Rectangle.Contains(this.zone.getBounds(), x, y);
    }

    // Test si la zone peut accueillir une carte
    canAcceptCard(): boolean {
        return this.cards.length < this.maxCards;
    }

    // Ajoute une carte
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

        this.evaluateHand();

        if (this.onChangeCallback) this.onChangeCallback();
    }

    // Supprime une carte
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

    // Met à jour la position des cartes
    private repositionCards(): void {
        const startX = this.zone.x - ((this.maxCards - 1) * this.cardSpacing) / 2;
        this.cards.forEach((card, i) => {
            const x = startX + i * this.cardSpacing;
            const y = this.zone.y;
            card.setPosition(x, y);
        });
    }

    // Test si la zone contient une carte
    containsCard(card: Card): boolean {
        return this.cards.includes(card);
    }

    // Renvoi le nombre de cartes
    getCardCount(): number {
        return this.cards.length;
    }

    public setMonsterName(name: string | null) {
        this.currentMonsterName = name;
    }

    // Evaluer la main
    evaluateHand(): string {
        if (this.cards.length < 1) return '';

        const valueMap: Record<string, number> = {
            '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14
        };

        // Qui est le monstre ?
        const monsterKey =
            (this.currentMonsterName ??
            (this.scene.game.registry.get('currentMonsterKey') as string | undefined) ??
            ''
            ).toLowerCase();

        const isYunderA = monsterKey.startsWith('yundera');

        // 1) RANGS BRUTS pour identifier la main (ne JAMAIS doubler ici)
        const baseValues = this.cards.map(c => valueMap[c.value]);
        const suits      = this.cards.map(c => c.suit);

        // 2) VALEURS DE SCORE (cœurs doublés seulement contre YunderA)
        const scoreValues = this.cards.map((c, i) => {
            const v = baseValues[i];
            return (isYunderA && c.suit === 'heart') ? v * 2 : v;
        });

        // Comptages pour les combinaisons → basé sur baseValues
        const counts: Record<number, number> = {};
        for (const v of baseValues) counts[v] = (counts[v] || 0) + 1;
        const countValues = Object.values(counts).sort((a, b) => b - a);
        const uniqueCounts = countValues.join('');

        // Flush / Straight → basé sur baseValues
        const isFlush = this.cards.length === 5 && suits.every(s => s === suits[0]);

        let isStraight = false;
        if (this.cards.length === 5) {
            const sortedUnique = [...new Set(baseValues)].sort((a, b) => a - b);
            for (let i = 0; i <= sortedUnique.length - 5; i++) {
            const slice = sortedUnique.slice(i, i + 5);
            if (slice.every((v, j, arr) => j === 0 || v === arr[j - 1] + 1)) {
                isStraight = true; break;
            }
            }
            // A-2-3-4-5 (wheel)
            const wheel = [14, 2, 3, 4, 5];
            if (wheel.every(v => baseValues.includes(v))) isStraight = true;
        }

        // Détermination du type de main (inchangé, mais basé sur baseValues/uniqueCounts/isFlush/isStraight)
        let handType = 'Carte Haute';
        let multiplier = 1;

        if (this.cards.length === 5) {
            const hasTenToAce = [10,11,12,13,14].every(v => baseValues.includes(v));
            if (isFlush && isStraight && hasTenToAce) { handType='Quinte Flush Royale'; multiplier=20; }
            else if (isFlush && isStraight)           { handType='Quinte Flush';        multiplier=15; }
            else if (uniqueCounts === '41')           { handType='Carré';               multiplier=12; }
            else if (uniqueCounts === '32')           { handType='Full';                multiplier=8; }
            else if (isFlush)                         { handType='Couleur';             multiplier=6; }
            else if (isStraight)                      { handType='Suite';               multiplier=5; }
            else if (uniqueCounts === '311')          { handType='Brelan';              multiplier=4; }
            else if (uniqueCounts === '221')          { handType='Double Paire';        multiplier=2.5; }
            else if (uniqueCounts === '2111')         { handType='Paire';               multiplier=1.5; }
        } else if (this.cards.length === 4) {
            if (uniqueCounts === '4')   { handType='Carré';        multiplier=12; }
            else if (uniqueCounts === '31') { handType='Brelan';   multiplier=4; }
            else if (uniqueCounts === '22') { handType='Double Paire'; multiplier=2.5; }
            else if (uniqueCounts === '211'){ handType='Paire';    multiplier=1.5; }
        } else if (this.cards.length === 3) {
            if (uniqueCounts === '3')   { handType='Brelan'; multiplier=4; }
            else if (uniqueCounts === '21'){ handType='Paire'; multiplier=1.5; }
        } else if (this.cards.length === 2) {
            if (uniqueCounts === '2')   { handType='Paire'; multiplier=1.5; }
        }

        // 3) Score final = somme des valeurs pondérées * multiplier
        const total = scoreValues.reduce((s, v) => s + v, 0);
        const score = Math.round(total * multiplier);
        this.lastScore = score;

        this.gameUI?.setScore(handType, score);
        return `${handType} - Score : ${score}`;
        }

    // Vide la zone
    clear(): void {
        this.cards.forEach(card => card.destroy());
        this.cards = [];
        this.repositionCards();
        if (this.onChangeCallback) {
            this.onChangeCallback();
        }
    }

    // Met a jour la zone
    public setOnChangeCallback(cb: () => void) {
        this.onChangeCallback = cb;
    }

    // Récupérer les cartes
    public getCards(): Card[] {
        return [...this.cards];
    }

    // Récupérer le dernier score
    public getScore(): number {
        return this.lastScore;
    }

    // Positionner la zone
    public setPosition(x: number, y: number): void {
        this.zone.setPosition(x, y);
        this.repositionCards();
    }
}
