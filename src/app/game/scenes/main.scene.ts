import Phaser from "phaser";
import { Monster, MonsterActionType } from "../classes/Monster";
import { Card } from "../classes/Card";
import { PlayZone } from "../classes/PlayZone";
import { BtnEndTurn } from "../classes/BtnEndTurn";
import { GameUI } from "../classes/GameUI";
import { Player } from "../classes/Player";
import { MONSTER_DEFINITIONS } from "../classes/monsters/simpleMonster";

import { Injector } from "@angular/core";
import { SavegameService } from "../../services/savegame.service";

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

  // Intent UI — marqués optionnels et créés "lazy" si besoin
  private intentContainer?: Phaser.GameObjects.Container;
  private intentIcon?: Phaser.GameObjects.Image | Phaser.GameObjects.Text;
  private intentValueText?: Phaser.GameObjects.Text;

  private currentTurn: "player" | "monster" = "player";

  private saveSvc?: SavegameService;
  private saveId?: string;
  private resumeFromSave = false;

  private isEnding = false;
  private selectedNodeIndex: number | null = null;

  constructor() {
    super("MainScene");
  }

  init(data: { nodeIndex?: number; resumeFromSave?: boolean; saveId?: string; hp?: number }) {
    this.isEnding = false;

    this.selectedNodeIndex = data?.nodeIndex ?? null;
    this.resumeFromSave = !!data?.resumeFromSave;
    this.saveId = data?.saveId;

    this.handCards = [];
    this.usedCards = [];
    this.discardedCards = [];
    this.currentTurn = "player";
    this.discardsUsed = 0;

    this.time?.removeAllEvents();
    this.input?.removeAllListeners();

    if (typeof data?.hp === 'number') {
      this.game.registry.set('playerHp', data.hp);
    }

    const inj = (window as any).ngInjector as Injector | undefined;
    if (inj && typeof (inj as any).get === "function") {
      this.saveSvc = (inj as any).get(SavegameService);
    } else {
      const regSvc = this.game.registry.get("saveSvc");
      if (regSvc) this.saveSvc = regSvc as SavegameService;
    }
  }

  preload() {
    this.load.image("background", "assets/images/fight_background.png");
    this.load.image("tapis", "assets/images/tapis_bg.png");
    this.load.image("ui_bg", "assets/images/ui_bg.png");

    const values = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
    values.forEach((value) => {
      this.load.image(`diamond_${value}`, `assets/cards/diamond_${value}.svg`);
      this.load.image(`heart_${value}`, `assets/cards/heart_${value}.svg`);
      this.load.image(`spade_${value}`, `assets/cards/spade_${value}.svg`);
      this.load.image(`clubs_${value}`, `assets/cards/clubs_${value}.svg`);
    });

    this.load.image("bluffChips", "assets/monsters/sprites/bluffChips.png");
    this.load.image("arnak", "assets/monsters/sprites/arnak.png");
    this.load.image("lowRollers", "assets/monsters/sprites/lowRollers.png");
  }

  create() {
    document.fonts.ready.then(() => {
      this.input.removeAllListeners();

      // Drag unique (évite les doubles handlers)
      this.input.on("dragstart", (_: Phaser.Input.Pointer, go: Phaser.GameObjects.GameObject) => {
        if (go instanceof Card) go.setDepth(1000);
      });
      this.input.on("drag", (_: Phaser.Input.Pointer, go: Phaser.GameObjects.GameObject, x: number, y: number) => {
        if (go instanceof Card) { go.x = x; go.y = y; }
      });
      this.input.on("dragend", (pointer: Phaser.Input.Pointer, go: Phaser.GameObjects.GameObject) => {
        if (go instanceof Card) {
          go.setDepth(0);
          if (this.playZone.isInside(pointer.x, pointer.y)) this.tryPlayCard(go);
          else go.resetPosition();
        }
      });

      // Décor + UI statique
      this.add.image(785, 0, "background").setOrigin(0.5, 0).setDisplaySize(this.scale.width / 1.25, this.scale.height / 1.42).setDepth(-10);
      this.add.tileSprite(0, 0, this.scale.width, this.scale.height, "tapis").setDisplaySize(this.scale.width * 2, this.scale.height * 2).setDepth(-12);
      this.add.image(0, 0, "ui_bg").setOrigin(0.5).setScale(1.25, 1.5);
      this.add.rectangle(800, 505, this.scale.width / 2 + 380, 12, 0xF7803C);

      // Boutons
      const BTN_Y = this.scale.height - 280;
      this.playButton    = new BtnEndTurn(this, this.scale.width - 190, BTN_Y, "Jouer");
      this.discardButton = new BtnEndTurn(this, this.scale.width -  80, BTN_Y, "Défausser");

      // Monster
      const randomConfig = Phaser.Utils.Array.GetRandom(MONSTER_DEFINITIONS);
      (this as any).currentMonsterConfig = randomConfig;
      this.monster = new Monster(
        this,
        this.scale.width - 150,
        285,
        randomConfig.texture,
        randomConfig.maxHP,
        randomConfig.actions,
      ).setScale(1.75);

      // Intent UI -> créer AVANT de s'abonner + init
      this.createIntentUI();

      // Un seul abonnement
      this.monster.on('intent:changed', (next: { type: MonsterActionType; value: number }) => this.updateIntentUI(next));

      // Init après que tout soit prêt
      this.monster.initIntent();

      // Mort du monstre
      this.events.once("monster:dead", () => {
        const cfg: any = (this as any).currentMonsterConfig;
        let reward = 0;
        if (typeof cfg?.goldReward === 'number') {
          reward = cfg.goldReward;
        } else if (cfg?.goldReward?.min != null && cfg?.goldReward?.max != null) {
          reward = Phaser.Math.Between(cfg.goldReward.min, cfg.goldReward.max);
        }

        if (reward > 0) {
          this.player.addGold(reward);
          this.gameUI.setGold(this.player.getGold());
          this.game.registry.set('gold', this.player.getGold());
        }

        (this as any)._lastGoldDelta = reward;
        this.onCombatWon();
      });

      // UI combat + joueur
      this.gameUI = new GameUI(this);

      const regGold = this.game.registry.get('gold');
      this.gameUI.setGold(typeof regGold === 'number' ? regGold : 0);

      this.gameUI.setDiscard(MainScene.MAX_DISCARD - this.discardsUsed);
      this.gameUI.setScore("", 0);

      const hpFromRegistry = this.game.registry.get('playerHp');
      this.player = new Player(this.gameUI, typeof hpFromRegistry === 'number' ? hpFromRegistry : undefined);

      // Si on reprend depuis une sauvegarde, applique les PV stockés
      this.applyHpFromSaveIfAny();

      // Zone de jeu
      this.playZone = new PlayZone(this, this.scale.width / 2 + 25, this.scale.height - 335, 700, 180);
      this.playZone.setGameUI(this.gameUI);

      this.playButton.setEnabled(false);
      this.discardButton.setEnabled(false);

      this.playZone.setOnChangeCallback(() => {
        const cardCount = this.playZone.getCardCount();
        const canPlay = cardCount >= 1 && cardCount <= 5;
        this.playButton.setEnabled(canPlay);

        const hasDiscardsLeft = this.discardsUsed < MainScene.MAX_DISCARD;
        this.discardButton.setEnabled(canPlay && hasDiscardsLeft);

        if (cardCount > 0) this.playZone.evaluateHand();
        else this.gameUI.setScore("", 0);
      });

      // main de départ
      const suits = ["diamond", "heart", "spade", "clubs"];
      const values = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
      const fulldeck = Phaser.Utils.Array.Shuffle(
        suits.flatMap((suit) => values.map((value) => ({ suit, value })))
      );
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

        card.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
          const downX = pointer.x, downY = pointer.y;
          card.once("pointerup", (upPointer: Phaser.Input.Pointer) => {
            const dist = Phaser.Math.Distance.Between(downX, downY, upPointer.x, upPointer.y);
            if (dist < 10 && !this.playZone.isInside(upPointer.x, upPointer.y)) {
              this.tryPlayCard(card);
            }
          });
        });
      }

      this.playButton.onClick(() => {
        this.playZone.getCards().forEach((card) => {
          const id = `${card.suit}_${card.value}`;
          if (!this.usedCards.includes(id)) this.usedCards.push(id);
        });

        this.playZone.evaluateHand();
        const score = this.playZone.getScore();
        this.monster.takeDamage(score);

        this.playZone.clear();

        const currentHandSize = this.handCards.length;
        const needed = 8 - currentHandSize;

        if (needed > 0) {
          let deck = suits.flatMap((suit) => values.map((value) => ({ suit, value })));
          const used = this.handCards.map((c) => `${c.suit}_${c.value}`).concat(this.usedCards);
          let remaining = deck.filter(
            (c) =>
              !used.includes(`${c.suit}_${c.value}`) &&
              !this.discardedCards.includes(`${c.suit}_${c.value}`)
          );

        if (remaining.length < needed) {
            const recycled = this.discardedCards.map((id) => {
              const [suit, value] = id.split("_");
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

            card.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
              const downX = pointer.x, downY = pointer.y;
              card.once("pointerup", (upPointer: Phaser.Input.Pointer) => {
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

        cardsInPlay.forEach((card) => {
          const id = `${card.suit}_${card.value}`;
          if (!this.discardedCards.includes(id)) this.discardedCards.push(id);
          card.destroy();
        });
        this.playZone.clear();

        const currentHandSize = this.handCards.length;
        const needed = 8 - currentHandSize;

        const suits = ["diamond", "heart", "spade", "clubs"];
        const values = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];

        if (needed > 0) {
          let deck = suits.flatMap((suit) => values.map((value) => ({ suit, value })));
          const used = this.handCards
            .map((c) => `${c.suit}_${c.value}`)
            .concat(this.usedCards)
            .concat(this.discardedCards);

          let remaining = deck.filter((c) => !used.includes(`${c.suit}_${c.value}`));

          if (remaining.length < needed) {
            const recycled = this.discardedCards.map((id) => {
              const [suit, value] = id.split("_");
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

            card.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
              const downX = pointer.x, downY = pointer.y;
              card.once("pointerup", (upPointer: Phaser.Input.Pointer) => {
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

      // réorg à la sortie de zone
      this.playZone.setOnCardRemoved((card: Card) => {
        const insertIndex = this.findInsertIndex(card);
        this.handCards.splice(insertIndex, 0, card);
        this.reorganizeHand();
      });

      // Resize
      this.scale.on("resize", (gameSize: Phaser.Structs.Size) => {
        const width = gameSize.width;
        const height = gameSize.height;
        if (this.playZone) this.playZone.setPosition(width / 2 + 25, height - 335);
        if (this.playButton) this.playButton.setPosition(width - 190, height - 280);
        if (this.discardButton) this.discardButton.setPosition(width - 80, height - 280);
        if (this.monster) this.monster.setPosition(width - 150, 285);
        this.reorganizeHand();
        this.positionIntentNearMonster();
      });

      // Cleanup
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.handCards.forEach((c) => c.destroy());
        this.handCards = [];
        this.usedCards = [];
        this.discardedCards = [];

        // 🔥 Nettoyage UI d’intention
        this.intentContainer?.destroy();
        this.intentIcon = undefined;
        this.intentValueText = undefined;
        this.intentContainer = undefined;

        this.input.removeAllListeners();
        this.time.removeAllEvents();
      });
    });
  }

  private async applyHpFromSaveIfAny() {
    if (!this.saveSvc) return;
    try {
      const save: any = await this.saveSvc.getCurrent();
      const hp =
        save?.playerHp ??
        save?.currentHp ??
        save?.player?.hp ??
        this.game.registry.get('playerHp') ??
        100;

      this.gameUI.setHP(hp);

      const gold =
        save?.gold ??
        save?.player?.gold ??
        this.game.registry.get('gold') ??
        0;

      this.gameUI.setGold(gold);
      this.game.registry.set('gold', gold);
      this.game.registry.set('playerHp', hp);

      if (this.player) this.player.setGold(gold);

      const anyPlayer = this.player as any;
      if (typeof anyPlayer.setHP === 'function') {
        anyPlayer.setHP(hp);
      } else if (typeof anyPlayer.getHP === 'function') {
        const cur = anyPlayer.getHP();
        if (hp < cur && typeof anyPlayer.takeDamage === 'function') {
          anyPlayer.takeDamage(cur - hp);
        } else if (hp > cur && typeof anyPlayer.heal === 'function') {
          anyPlayer.heal(hp - cur);
        }
      }
    } catch { /* ignore */ }
  }

  private tryPlayCard(card: Card) {
    if (this.playZone.containsCard(card)) return;
    if (this.playZone.canAcceptCard()) {
      this.playZone.addCard(card);
      const index = this.handCards.indexOf(card);
      if (index !== -1) this.handCards.splice(index, 1);
      this.reorganizeHand();
    } else {
      card.resetPosition();
    }
  }

  private endPlayerTurn() {
    this.currentTurn = "monster";
    this.time.delayedCall(1000, () => this.monsterPlay());
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
      if (card.x < this.handCards[i].x) return i;
    }
    return this.handCards.length;
  }

  private monsterPlay() {
    this.playButton.setEnabled(false);
    this.discardButton.setEnabled(false);

    const cfg: any = (this as any).currentMonsterConfig || {};
    const perTurn = Math.max(1, cfg.actionsPerTurn ?? 1);

    const doOne = () => {
      const action = this.monster.playNextAction();
      if (!action) return;

      switch (action.type) {
        case "attack":
          this.player.takeDamage(action.value);
          break;
        case "defend":
          this.monster.addShield(action.value);
          break;
        case "waiting":
          break;
        case "StealPercent":
          this.player.stealGoldPercent(action.value);
          break;
      }
    };

    let i = 0;
    const runNext = () => {
      if (i >= perTurn) {
        this.time.delayedCall(300, () => this.startPlayerTurn());
        return;
      }
      doOne();
      i++;
      this.time.delayedCall(250, runNext);
    };

    runNext();
  }

  private startPlayerTurn() {
    this.currentTurn = "player";
  }

  private positionIntentNearMonster() {
    if (!this.monster || !this.intentContainer) return;
    const p = (this.monster as any).getHpBarAnchor?.();
    if (p) {
      this.intentContainer.setPosition(p.x - 20, p.y);
    } else {
      this.intentContainer.setPosition(this.monster.x - 100, this.monster.y - 80);
    }
  }

  private createIntentUI() {
    if (this.intentContainer) return; // déjà créée

    this.intentIcon = this.add.text(0, 0, '?', {
      fontFamily: 'romet',
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.intentValueText = this.add.text(-25, 0, '0', {
      fontFamily: 'romet',
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.intentContainer = this.add.container(0, 0, [this.intentIcon, this.intentValueText]).setDepth(200);
    this.positionIntentNearMonster();
  }

  private updateIntentUI(next: { type: MonsterActionType; value: number }) {
    // Lazy create si pas encore prête
    if (!this.intentIcon || !this.intentValueText || !this.intentContainer) {
      this.createIntentUI();
    }

    const mapText: Record<MonsterActionType, string> = {
      attack: '⚔',
      defend: '🛡',
      waiting: '⏳',
      StealPercent: '💰',
      heal: '➕',
      buff: '✨',
      debuff: '☠️'
    };

    if (this.intentIcon instanceof Phaser.GameObjects.Text) {
      this.intentIcon.setText(mapText[next.type] || '❓' as any);
    }
    const valueLabel = next.type === 'StealPercent' ? `${next.value}%` : `${next.value}`;
    this.intentValueText!.setText(valueLabel);

    this.positionIntentNearMonster();
  }

  private async onCombatWon() {
    const hpNow = this.player.getHP();
    this.game.registry.set('playerHp', hpNow);

    const goldNow = this.player.getGold();
    this.game.registry.set('gold', goldNow);

    const goldDelta = (this as any)._lastGoldDelta ?? 0;

    const map = this.scene.get('MapScene') as Phaser.Scene | undefined;
    map?.events.emit('hp:update', hpNow);
    map?.events.emit('gold:update', goldNow);

    if (this.isEnding) return;
    this.isEnding = true;

    this.time.removeAllEvents();
    this.input.removeAllListeners();
    this.playButton?.setEnabled(false);
    this.discardButton?.setEnabled(false);

    if (this.saveSvc && this.saveId) {
      try {
        await this.saveSvc.combatEnd(this.saveId, {
          result: "won",
          playerHp: this.player.getHP(),
          goldDelta
        });
      } catch (e) {
        console.warn("[MainScene] combatEnd a échoué (on retourne quand même sur la map) :", e);
      }
    }

    if (this.scene.isSleeping("MapScene")) {
      this.scene.wake("MapScene");
    } else if (this.scene.isPaused("MapScene")) {
      this.scene.resume("MapScene");
    }
    this.scene.bringToTop("MapScene");

    this.scene.stop();
  }
}
