import Phaser from "phaser";
import { Monster, MonsterActionType } from "../classes/Monster";
import { Card } from "../classes/Card";
import { PlayZone } from "../classes/PlayZone";
import { BtnEndTurn } from "../classes/BtnEndTurn";
import { GameUI } from "../classes/GameUI";
import { Player } from "../classes/Player";
import { MONSTER_DEFINITIONS } from "../classes/monsters/simpleMonster";
import { BOSS_DEFINITIONS } from "../classes/monsters/bossMonster";
import { ELITE_DEFINITIONS } from "../classes/monsters/eliteMonster";

import { Injector } from "@angular/core";
import { SavegameService } from "../../services/savegame.service";
import { EncounterType } from "../types/encounter";
import { extractSoundKeys } from "../audio/sound-utils";
import { clearDefeatedPools, filterPoolByDefeated, markMonsterDefeated } from "../state/defeated-pool";

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
  private static readonly MAX_DISCARD = 2;
  private discardsUsed = 0;

  private currentMonsterConfig: any;

  private sortMode: 'none' | 'value' | 'suit' | 'suitThenValue' | 'valueThenSuit' = 'none';

  private readonly valueOrder = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  private readonly suitOrder = ['clubs', 'diamond', 'heart', 'spade'];

  private encounterType: EncounterType = 'normal';

  public getTargetBounds(key: string) {
    if (key === 'leftInfo') {
      return this.gameUI.getBounds();
    }
    return null;
  }

  // Compare les cartes par leur valeur
  private compareByValue = (a: Card, b: Card) => {
    const av = this.valueOrder.indexOf(a.value);
    const bv = this.valueOrder.indexOf(b.value);
    if (av !== bv) return av - bv;
    const as = this.suitOrder.indexOf(a.suit);
    const bs = this.suitOrder.indexOf(b.suit);
    return as - bs;
  }

  // Compare les cartes par leur couleur
  private compareBySuit = (a: Card, b: Card) => {
    const as = this.suitOrder.indexOf(a.suit);
    const bs = this.suitOrder.indexOf(b.suit);
    if (as !== bs) return as - bs;
    const av = this.valueOrder.indexOf(a.value);
    const bv = this.valueOrder.indexOf(b.value);
    return av - bv;
  }

  // Tri de la main
  private sortHand() {
    switch (this.sortMode) {
      case 'value' : this.handCards.sort(this.compareByValue); break;
      case 'suit' : this.handCards.sort(this.compareBySuit); break;
      case 'valueThenSuit':
        this.handCards.sort((a, b) => {
          const primary = this.compareByValue(a, b);
          return primary !== 0 ? primary : this.compareBySuit(a, b);
        });
        break;
      case 'suitThenValue':
        this.handCards.sort((a,b)=> {
          const primary = this.compareBySuit(a,b);
          return primary !== 0 ? primary : this.compareByValue(a,b);
        });
        break;
      case 'none':
      default: break;
    }
  }

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

  init(data: { nodeIndex?: number; resumeFromSave?: boolean; saveId?: string; hp?: number; encounterType?: EncounterType }) {
    this.isEnding = false;

    this.selectedNodeIndex = data?.nodeIndex ?? null;
    this.resumeFromSave = !!data?.resumeFromSave;
    this.saveId = data?.saveId;

    this.encounterType = data?.encounterType ?? this.game.registry.get('encounterType') ?? 'normal';

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
    // UI
    this.load.image("background", "assets/images/fight_background.png");
    this.load.image("boss_background", "assets/images/bossfight_background.png");
    this.load.image("tapis", "assets/images/tapis_bg.png");
    this.load.image("ui_bg", "assets/images/ui_bg.png");

    // Cartes
    const values = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
    values.forEach((value) => {
      this.load.image(`diamond_${value}`, `assets/cards/diamond_${value}.svg`);
      this.load.image(`heart_${value}`, `assets/cards/heart_${value}.svg`);
      this.load.image(`spade_${value}`, `assets/cards/spade_${value}.svg`);
      this.load.image(`clubs_${value}`, `assets/cards/clubs_${value}.svg`);
    });

    // Monstres (normaux)
    this.load.image("bluffChips", "assets/monsters/sprites/bluffChips.png");
    this.load.image("arnak", "assets/monsters/sprites/arnak.png");
    this.load.image("lowRollers", "assets/monsters/sprites/lowRollers.png");
    this.load.image("devilRoulette", "assets/monsters/sprites/devilRoulette.png");
    this.load.image("maccaroni", "assets/monsters/sprites/maccaroni.png");
    this.load.image("maccaroni2", "assets/monsters/sprites/maccaroni2.png");
    this.load.image("piloteRaccoon", "assets/monsters/sprites/piloteRaccoon.png");
    this.load.image("laitka", "assets/monsters/sprites/laitka.png");

    // Monstres (elite)
    this.load.image("yunderA", "assets/monsters/sprites/heartQueenElite.png");
    this.load.image("yunderA2", "assets/monsters/sprites/heartQueenElite2.png");
    this.load.image("yunderA3", "assets/monsters/sprites/heartQueenElite3.png");

    // Monstres (boss) — charge tous les sprites du pool boss
    BOSS_DEFINITIONS.forEach(def => {
      // convention: le fichier porte le même nom que def.texture
      this.load.image(def.texture, `assets/monsters/sprites/${def.texture}.png`);
    });

    const allDefs = [
      ...MONSTER_DEFINITIONS,
      ...BOSS_DEFINITIONS,
      ...ELITE_DEFINITIONS
    ];

    const allKeys = Array.from(new Set(
      allDefs.flatMap(d => extractSoundKeys(d.sounds))
    ))

    allKeys.forEach(key => {
      this.load.audio(key, [
        `assets/audio/sfx/${key}.ogg`
      ])
    })
  }

  create() {
    // Transition
    this.cameras.main.fadeOut(200, 0, 0, 0);
    this.cameras.main.fadeIn(200, 0, 0, 0);
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

      // Décor + UI statique (fond différent si boss)
      const bgKey = this.encounterType === 'boss' ? "boss_background" : "background";
      this.add.image(785, 0, bgKey).setOrigin(0.5, 0).setDisplaySize(this.scale.width / 1.25, this.scale.height / 1.42).setDepth(-10);
      this.add.tileSprite(0, 0, this.scale.width, this.scale.height, "tapis").setDisplaySize(this.scale.width * 2, this.scale.height * 2).setDepth(-12);
      this.add.image(0, 0, "ui_bg").setOrigin(0.5).setScale(1.25, 1.5);
      this.add.rectangle(800, 505, this.scale.width / 2 + 380, 12, 0xF7803C);

      // Boutons
      const BTN_Y = this.scale.height - 280;
      this.playButton    = new BtnEndTurn(this, this.scale.width - 190, BTN_Y, "Jouer");
      this.discardButton = new BtnEndTurn(this, this.scale.width -  80, BTN_Y, "Défausser");

      // Pool brut selon le type de rencontre
      const poolRaw =
        this.encounterType === 'boss'
          ? BOSS_DEFINITIONS
          : this.encounterType === 'elite'
            ? ELITE_DEFINITIONS
            : MONSTER_DEFINITIONS;

      // 1) filtrage blacklist de l'étage
      let candidatePool = filterPoolByDefeated(this, this.encounterType, poolRaw);

      // 2) éviter le même monstre que la dernière rencontre si possible
      const last = this.game.registry.get('lastMonsterName') as string | undefined;
      if (last && candidatePool.length > 1) {
        const alt = candidatePool.filter(m => m.name !== last);
        if (alt.length > 0) candidatePool = alt;
      }

      // 3) si vraiment plus rien (edge case : tout filtré), on retombe sur poolRaw
      if (candidatePool.length === 0) {
        const alt = last ? poolRaw.filter(m => m.name !== last) : poolRaw;
        candidatePool = alt.length > 0 ? alt : poolRaw;
      }

      // Tirage final
      const randomConfig = Phaser.Utils.Array.GetRandom(candidatePool);

      this.currentMonsterConfig = randomConfig;
      this.game.registry.set('currentMonsterKey', randomConfig.texture);

      // mémoriser pour éviter la répétition immédiate la prochaine fois
      if (randomConfig?.name) {
        this.game.registry.set('lastMonsterName', randomConfig.name);
      }

      this.monster = new Monster(
        this,
        this.scale.width - 150,
        285,
        randomConfig.texture,
        randomConfig.maxHP,
        randomConfig.actions,
        randomConfig.sounds
      ).setScale(
        this.encounterType === 'boss'  ? 1.9
        : this.encounterType === 'elite' ? 1.85
        : 1.75
      );

      // UI intentions du monstre
      this.createIntentUI();
      
      const sortByValueText = this.add.text(this.scale.width - 140, this.scale.height - 195, 'Valeur', {
        color: '#FFD700', fontFamily: 'romet', fontSize: '18px'
      }).setInteractive({ useHandCursor: true });

      const sortBySuitText = this.add.text(this.scale.width - 220, this.scale.height - 195, 'Couleur', {
        color: '#FFD700', fontFamily: 'romet', fontSize: '18px'
      }).setInteractive({ useHandCursor: true });

      const sortResetText = this.add.text(this.scale.width - 280, this.scale.height - 195, '', {
        color: '#FFD700', fontFamily: 'romet', fontSize: '18px'
      }).setInteractive({ useHandCursor: true });

      sortByValueText.on('pointerup', () => {
        this.sortMode = 'value';
        this.sortHand();
        this.reorganizeHand();
      });

      sortBySuitText.on('pointerup', () => {
        this.sortMode = 'suit';
        this.sortHand();
        this.reorganizeHand();
      });

      sortResetText.on('pointerup', () => {
        this.sortMode = 'none';
        this.reorganizeHand();
      });

      // Raccourcis clavier (V, C, N)
      this.input.keyboard?.on('keydown-V', () => {
        this.sortMode = 'value'; this.sortHand(); this.reorganizeHand();
      });
      this.input.keyboard?.on('keydown-C', () => {
        this.sortMode = 'suit'; this.sortHand(); this.reorganizeHand();
      });
      this.input.keyboard?.on('keydown-N', () => {
        this.sortMode = 'none'; this.reorganizeHand();
      });

      // Un seul abonnement
      this.monster.on('intent:changed', (next: { type: MonsterActionType; value: number }) => this.updateIntentUI(next));

      // Init intention
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

      this.playZone.setMonsterName(this.currentMonsterConfig?.texture ?? null);

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

        this.updateButtonsForCharm();
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
      // Tri + placement initial de la main
      this.sortHand();
      this.reorganizeHand();

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

          this.sortHand();
          this.reorganizeHand();
        }

        this.playButton.setEnabled(false);
        this.discardButton.setEnabled(false);

        this.endPlayerTurn();
      });

      this.discardButton.onClick(() => {
        if (this.hasCharmedInZone()) return;

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

          this.sortHand();
          this.reorganizeHand();
        }

        this.discardsUsed++;
        this.gameUI.setDiscard(MainScene.MAX_DISCARD - this.discardsUsed);

        this.playButton.setEnabled(false);
        this.discardButton.setEnabled(false);
      });

      // réorg à la sortie de zone
      this.playZone.setOnCardRemoved((card: Card) => {
        // Si la carte est charmée, on la REPOUSSE dans la zone (interdit de la retirer)
        if (this.isCharmed(card)) {
          // Re-snap dans la zone au prochain tick pour laisser la physique/drag finir
          this.time.delayedCall(0, () => this.playZone.addCard(card));
          this.updateButtonsForCharm();
          return;
        }

        // Sinon comportement normal : retour en main
        const insertIndex = this.findInsertIndex(card);
        this.handCards.splice(insertIndex, 0, card);
        this.sortHand();
        this.reorganizeHand();
        this.updateButtonsForCharm();
      });

      // Resize
      this.scale.on("resize", (gameSize: Phaser.Structs.Size) => {
        const width = gameSize.width;
        const height = gameSize.height;
        if (this.playZone) this.playZone.setPosition(width / 2 + 25, height - 335);
        if (this.playButton) this.playButton.setPosition(width - 190, height - 280);
        if (this.discardButton) this.discardButton.setPosition(width - 80, height - 280);
        if (this.monster) this.monster.setPosition(width - 150, 285);
        this.sortHand();
        this.reorganizeHand();
        this.positionIntentNearMonster();
      });

      // Cleanup
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.handCards.forEach((c) => c.destroy());
        this.handCards = [];
        this.usedCards = [];
        this.discardedCards = [];

        // Clear de l'UI de l'intention
        this.intentContainer?.destroy();
        this.intentIcon = undefined;
        this.intentValueText = undefined;
        this.intentContainer = undefined;

        this.input.removeAllListeners();
        this.time.removeAllEvents();
      });
    });
  }

  // Appliquer les HP et le gold de la sauvegarde si elle existe
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

  // Jouer une carte
  private tryPlayCard(card: Card) {
    if (this.playZone.containsCard(card)) return;
    if (this.playZone.canAcceptCard()) {
      this.playZone.addCard(card);
      const index = this.handCards.indexOf(card);
      if (index !== -1) this.handCards.splice(index, 1);
      this.sortHand();
      this.reorganizeHand();
    } else {
      card.resetPosition();
    }
  }

  // Fin du tour
  private endPlayerTurn() {
    this.currentTurn = "monster";
    this.time.delayedCall(1000, () => this.monsterPlay());
  }

  // Reorganiser la main
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

  // Trouver l'index de la carte appropriée
  private findInsertIndex(card: Card): number {
    for (let i = 0; i < this.handCards.length; i++) {
      if (card.x < this.handCards[i].x) return i;
    }
    return this.handCards.length;
  }

  // Jouer le tour du monstre
  private monsterPlay() {
    this.playButton.setEnabled(false);
    this.discardButton.setEnabled(false);

    const cfg: any = (this as any).currentMonsterConfig || {};
    const perTurn = Math.max(1, cfg.actionsPerTurn ?? 1);

    const ATOMIC_DELAY = 150; // pacing entre étapes d’un combo (rapide)
    const ACTION_DELAY = 250; // pacing entre actions “de haut niveau”

    const doAtomic = () => {
      const action = this.monster.playNextAction();
      if (!action) return;

      switch (action.type) {
        case "attack":       this.player.takeDamage(action.value); break;
        case "defend":       this.monster.addShield(action.value); break;
        case "waiting":      break;
        case "StealPercent": this.player.stealGoldPercent(action.value); break;
        case "charm":        this.applyCharm(Math.max(1, action.value || 1)); break;
        case "transform":    this.monster.transformToForm(action.value); break;
        case "milk":         this.monster.milk(action.value); break;
        // 'combo' ne devrait jamais tomber ici car playNextAction renvoie une atomique
      }
    };

    let highLevelCount = 0;

    const drainComboThenNext = () => {
      // Tant qu’il reste des sous-étapes, on continue dans CE tour
      if (this.monster.getPendingCount() > 0) {
        doAtomic();
        this.time.delayedCall(ATOMIC_DELAY, drainComboThenNext);
        return;
      }

      // Fin du combo (ou ce n’était pas un combo) → on passe à l’action “de haut niveau” suivante
      highLevelCount++;
      if (highLevelCount >= perTurn) {
        this.time.delayedCall(300, () => this.startPlayerTurn());
        return;
      }

      // Action de haut niveau suivante
      this.time.delayedCall(ACTION_DELAY, runOneHighLevel);
    };

    const runOneHighLevel = () => {
      // Démarre une action “de haut niveau” (qui peut être atomique OU un combo)
      // playNextAction renvoie toujours une atomique (ou la 1ère étape du combo)
      doAtomic();
      // Puis on draine le reste si c'était un combo
      this.time.delayedCall(ATOMIC_DELAY, drainComboThenNext);
    };

    // kickstart
    runOneHighLevel();
  }

  private isCharmed(card: Card): boolean {
    return !!(card as any).getData?.('charmed');
  }

  /** Y a-t-il au moins une carte charmée dans la playzone ? */
  private hasCharmedInZone(): boolean {
    return this.playZone.getCards().some(c => (c as any).getData?.('charmed'));
  }

  /** Met à jour les boutons en tenant compte du charm. */
  private updateButtonsForCharm() {
    const cardCount = this.playZone.getCardCount();
    const hasDiscardsLeft = this.discardsUsed < MainScene.MAX_DISCARD;
    const forbidDiscard = this.hasCharmedInZone(); // on bloque la défausse si charm
    this.playButton.setEnabled(cardCount >= 1 && cardCount <= 5);
    this.discardButton.setEnabled(cardCount >= 1 && cardCount <= 5 && hasDiscardsLeft && !forbidDiscard);
  }

  /** Applique Charm : prend N cartes aléatoires de la main (hors zone) et les force dans la zone. */
  private applyCharm(n: number = 1) {
    // Candidats = cartes en main et PAS déjà dans la zone
    const candidates = this.handCards.filter(c => !this.playZone.containsCard(c));
    if (candidates.length === 0) {
      // S'il n'y a rien en main, on peut marquer une carte déjà en zone (edge case)
      const already = this.playZone.getCards();
      if (already.length > 0) {
        const c = Phaser.Utils.Array.GetRandom(already) as Card;
        (c as any).setData?.('charmed', true);
        this.updateButtonsForCharm();
      }
      return;
    }

    Phaser.Utils.Array.Shuffle(candidates);
    const take = Math.min(n, candidates.length);
    for (let i = 0; i < take; i++) {
      const card = candidates[i];
      // On la force dans la playzone
      this.playZone.addCard(card);
      // On la retire de la main
      const idx = this.handCards.indexOf(card);
      if (idx !== -1) this.handCards.splice(idx, 1);
      // On marque charmée
      (card as any).setData?.('charmed', true);
    }

    // Réordonner visuellement la main
    this.sortHand();
    this.reorganizeHand();

    // Mettre à jour l'état des boutons (défausse interdite si charm)
    this.updateButtonsForCharm();

    // (Optionnel) petit feedback visuel
    this.tweens.add({
      targets: this.playZone.getCards().filter(c => (c as any).getData?.('charmed')),
      scale: { from: 1.05, to: 1 },
      duration: 200,
      ease: 'Sine.easeOut'
    });
  }

  // Commencer le tour du joueur
  private startPlayerTurn() {
    this.currentTurn = "player";
  }

  // Positionner l'intention au-dessus du monstre
  private positionIntentNearMonster() {
    if (!this.monster || !this.intentContainer) return;
    const p = (this.monster as any).getHpBarAnchor?.();
    if (p) {
      this.intentContainer.setPosition(p.x - 20, p.y);
    } else {
      this.intentContainer.setPosition(this.monster.x - 100, this.monster.y - 80);
    }
  }

  // Créer l'UI de l'intention
  private createIntentUI() {
    if (this.intentContainer) return;

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

  // Mettre à jour l'UI de l'intention
  private updateIntentUI(next: { type: MonsterActionType; value: number }) {
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
      debuff: '☠️',
      doubleAtk: '🌟',
      charm: '❤️',
      transform: '❓',
      combo: '➰',
      milk: '🥛'
    };

    if (this.intentIcon instanceof Phaser.GameObjects.Text) {
      this.intentIcon.setText(mapText[next.type] || '❓' as any);
    }
    const valueLabel = next.type === 'StealPercent' ? `${next.value}%` : `${next.value}`;
    this.intentValueText!.setText(valueLabel);

    this.positionIntentNearMonster();
  }

  // Fin de combat
  private async onCombatWon() {
    const hpNow = this.player.getHP();
    this.game.registry.set('playerHp', hpNow);

    const goldNow = this.player.getGold();
    this.game.registry.set('gold', goldNow);

    const goldDelta = (this as any)._lastGoldDelta ?? 0;

    const map = this.scene.get('MapScene') as Phaser.Scene | undefined;
    map?.events.emit('hp:update', hpNow);
    map?.events.emit('gold:update', goldNow);

    const cfg: any = (this as any).currentMonsterConfig;

    if (this.encounterType === 'boss') {
      clearDefeatedPools(this);
      this.game.registry.set('lastMonsterName', undefined); // reset pour l'étage suivant
    } else {
      if (cfg?.name) markMonsterDefeated(this, this.encounterType, cfg.name);
    }

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
          goldDelta,
          // encouterType: this.encounterType,
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