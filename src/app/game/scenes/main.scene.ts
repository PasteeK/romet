import Phaser from "phaser";
import { PlayerUi } from "../classes/PlayerUi";
import { Monster, MonsterAction } from "../classes/Monster";
import { Card } from "../classes/Card";
import { PlayZone } from "../classes/PlayZone";
import { BtnEndTurn } from "../classes/BtnEndTurn";
import { GameUI } from "../classes/GameUI";
import { Player } from "../classes/Player";
import { MONSTER_DEFINITIONS } from "../classes/monsters/simpleMonster";

export class MainScene extends Phaser.Scene {
    private playZone!: PlayZone;
    private handCards: Card[] = [];
    private usedCards: string[] = [];
    private monster!: Monster;
    private discardedCards: string[] = [];
    private gameUI!: GameUI;
    private player!: Player;
    private playButton!: BtnEndTurn;
    private discardButton!: BtnEndTurn;
    private static readonly MAX_DISCARD = 3;
    private discardsUsed = 0;

    private currentTurn: 'player' | 'monster' = 'player';

    constructor() {
        super('MainScene');
    }

    private tryPlayCard(card: Card) {
        if (this.playZone.containsCard(card)) return;

        if (this.playZone.canAcceptCard()) {
            this.playZone.addCard(card);

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

    private endPlayerTurn() {
        this.currentTurn = 'monster';
        this.time.delayedCall(1000, () => {
            this.monsterPlay();
        })
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

    private monsterPlay() {
        console.log("[Debug] Monstre joue son tour");
        this.playButton.setEnabled(false);
        this.discardButton.setEnabled(false);
        const action = this.monster.playNextAction();

        switch (action.type) {
            case 'attack':
                console.log(`Le monstre attaque pour ${action.value} dégâts !`);
                this.player.takeDamage(action.value);
                break;

            case 'defend':
                console.log(`Le monstre gagne ${action.value} en défense`);
                this.monster.addShield(action.value);
                break;

            case 'waiting':
                console.log(`Le monstre attend...`);
                break;
            
            case 'StealPercent':
                const amontStolen = this.player.stealGoldPercent(action.value);
                console.log(`Le monstre vole ${amontStolen} gold !`);
                break;
        }

        this.time.delayedCall(1000, () => {
            this.startPlayerTurn();
        });
    }

    private startPlayerTurn() {
        this.currentTurn = 'player';
    }

    private selectedNodeIndex: number | null = null;

    init(data: { nodeIndex?: number }) {
        this.selectedNodeIndex = data?.nodeIndex ?? null;

        this.handCards = [];
        this.usedCards = [];
        this.discardedCards = [];
        this.currentTurn = 'player';

        this.discardsUsed = 0;

        this.time?.removeAllEvents();
        this.input?.removeAllListeners();
    }

    private onCombatWon() {
        this.time.removeAllEvents();
        this.input.removeAllListeners();
        this.playButton?.setEnabled(false);
        this.discardButton?.setEnabled(false);

        if (this.selectedNodeIndex != null) {
            this.game.events.emit('node:cleared', this.selectedNodeIndex);
        }

        if (this.scene.isSleeping('MapScene')) {
            this.scene.wake('MapScene');
        } else if (this.scene.isPaused('MapScene')) {
            this.scene.resume('MapScene');
        }

        this.scene.bringToTop('MapScene');

        this.scene.stop();
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
        this.load.image('arnak', 'assets/monsters/sprites/arnak.png');
    }

    create() {
        document.fonts.ready.then(() => {

            // Reinitialisation des inputs
            this.input.removeAllListeners();

            this.input.on('dragstart', (_: Phaser.Input.Pointer, go: Phaser.GameObjects.GameObject) => {
            if (go instanceof Card) go.setDepth(1000);
            });

            this.input.on('drag', (_: Phaser.Input.Pointer, go: Phaser.GameObjects.GameObject, x: number, y: number) => {
            if (go instanceof Card) { go.x = x; go.y = y; }
            });

            this.input.on('dragend', (pointer: Phaser.Input.Pointer, go: Phaser.GameObjects.GameObject) => {
            if (go instanceof Card) {
                go.setDepth(0);
                if (this.playZone.isInside(pointer.x, pointer.y)) this.tryPlayCard(go);
                else go.resetPosition();
            }
            });


            // Création de l'UI
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

            this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
                const width = gameSize.width;
                const height = gameSize.height;

                // Repositionnement des éléments
                if (this.playZone) {
                    this.playZone.setPosition(width / 2 + 25, height - 335);
                }

                if (this.playButton) {
                    this.playButton.setPosition(width - 190, height - 280);
                }

                if (this.discardButton) {
                    this.discardButton.setPosition(width - 80, height - 280);
                }

                if (this.monster) {
                    this.monster.setPosition(width - 150, 285);
                }

                // Reorganise la main aussi
                this.reorganizeHand();
            });


            // Génération d'un monstre aléatoire
            const randomConfig = Phaser.Utils.Array.GetRandom(MONSTER_DEFINITIONS);

            this.monster = new Monster(
                this,
                this.scale.width - 150,
                285,
                randomConfig.texture,
                randomConfig.maxHP,
                randomConfig.actions
            ).setScale(1.75);

            this.events.once('monster:dead', () => this.onCombatWon());
    
            // Création de l'UI
            this.gameUI = new GameUI(this);
            this.gameUI.setHP(100);
            this.gameUI.setGold(0);
            this.gameUI.setDiscard(0);
            this.gameUI.setDiscard(MainScene.MAX_DISCARD - this.discardsUsed);
            this.gameUI.setScore('', 0);

            // Création du joueur
            this.player = new Player(this.gameUI);
    
            // Création de la zone de jeu
            this.playZone = new PlayZone(this, this.scale.width / 2 + 25, this.scale.height - 335, 700, 180);
            this.playZone.setGameUI(this.gameUI);
    
            this.playButton = new BtnEndTurn(this, this.scale.width - 190, this.scale.height - 280, 'Jouer');
            this.discardButton = new BtnEndTurn(this, this.scale.width - 80, this.scale.height - 280, 'Défausser');
    
            this.playButton.setEnabled(false);
            this.discardButton.setEnabled(false);
    
            this.playZone.setOnChangeCallback(() => {
                const cardCount = this.playZone.getCardCount();
                const canPlay = cardCount >= 1 && cardCount <= 5;

                this.playButton.setEnabled(canPlay);

                const hasDiscardsLeft = this.discardsUsed < MainScene.MAX_DISCARD;
                this.discardButton.setEnabled(canPlay && hasDiscardsLeft);

                if (cardCount > 0) {
                    this.playZone.evaluateHand();
                } else {
                    this.gameUI.setScore('', 0);
                }
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
    
            this.playButton.onClick(() => {
                this.playZone.getCards().forEach(card => {
                    const id = `${card.suit}_${card.value}`;
                    if (!this.usedCards.includes(id)) {
                        this.usedCards.push(id);
                    }
                });
    
                const result = this.playZone.evaluateHand();
                const score = this.playZone.getScore();
                this.monster.takeDamage(score)
    
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
    
                this.playButton.setEnabled(false);
                this.discardButton.setEnabled(false);

                this.endPlayerTurn();
            });
    
    
            this.discardButton.onClick(() => {
                if (this.discardsUsed >= MainScene.MAX_DISCARD) return;
                const cardsInPlay = this.playZone.getCards();
                if (cardsInPlay.length === 0) return;

                cardsInPlay.forEach(card => {
                    const id = `${card.suit}_${card.value}`;
                    if (!this.discardedCards.includes(id)) this.discardedCards.push(id);
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

                this.discardsUsed++;
                this.gameUI.setDiscard(MainScene.MAX_DISCARD - this.discardsUsed);

                this.playButton.setEnabled(false);
                this.discardButton.setEnabled(false);
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

            this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
                this.handCards.forEach(c => c.destroy());
                this.handCards = [];
                this.usedCards = [];
                this.discardedCards = [];
                this.input.removeAllListeners();
                this.time.removeAllEvents();
            })
        })
    }
}
