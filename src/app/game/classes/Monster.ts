import Phaser from "phaser";
import { MonsterSounds, SoundSet } from "./monsters/types";

// Définition des actions disponibles (Evite les typo, j'en ai deja fait plusieurs alors je suis passé par des types)
export type MonsterActionType =
  'attack' |
  'defend' |
  'heal' |
  'buff' |
  'debuff' |
  'waiting' |
  'StealPercent'|
  'doubleAtk' |
  'charm' |
  'transform' |
  'combo' |
  'milk';

// Définition d'une action
export interface MonsterAction {
  type: MonsterActionType;
  value: number;
  description: string;
  steps?: MonsterAction[];
  repeat?: number;
  delayMs?: number;
}

function pickOne<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

// Joue un son simple s'il existe, sinon joue un son aléatoire parmis le cast de base
function playSound(scene: Phaser.Scene, set?: SoundSet) {
  if (!set) return;
  const ref = Array.isArray(set) ? pickOne(set) : set;
  if (!ref) return;

  if (typeof ref === "string") {
    // clé
    scene.sound.play(ref);
  } else {
    const { key, volume, rate, detune } = ref;
    scene.sound.play(key, { volume, rate, detune });
  }
}

// Création du monstre pour Phaser
export class Monster extends Phaser.GameObjects.Container {
  // Variables
  private hpBar: Phaser.GameObjects.Graphics;
  private maxHP: number;
  private currentHP: number;
  private shield: number = 0;
  private shieldText!: Phaser.GameObjects.Text;
  private sounds?: MonsterSounds;

  private actions: MonsterAction[] = [];
  private actionIndex: number = 0;
  private pending: MonsterAction[] = [];

  private sprite!: Phaser.GameObjects.Image;
  private isDead = false;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, hp: number, actions: MonsterAction[], sounds?: MonsterSounds) {
    super(scene, x, y);
    // Variables
    this.maxHP = hp;
    this.currentHP = hp;
    this.actions = actions;
    this.sounds = sounds;

    // Création du sprite
    this.sprite = scene.add.image(0, 10, texture).setOrigin(0.5);

    // Création de la barre de vie visuelle
    this.hpBar = scene.add.graphics();
    this.updateHPBar();

    // Création du texte de la barre de bouclier
    this.shieldText = scene.add.text(0, -this.sprite.height / 2 - 20, '', {
      fontSize: '16px',
      color: '#00ffff',
      fontFamily: 'romet',
      backgroundColor: 'rgba(0,0,0,0)',
      padding: { x: 6, y: 2 },
    }).setOrigin(0.5);

    this.add([this.sprite, this.hpBar, this.shieldText]);
    scene.add.existing(this);

    this.playSpawn();
  }

  // Jouer le son de spawn
  private playSpawn() {
    playSound(this.scene, this.sounds?.spawn);
  }

  // Jouer le son de hit
  private playHit() {
    playSound(this.scene, this.sounds?.hit);
  }

  // Jouer le son de mort
  private playDeath() {
    playSound(this.scene, this.sounds?.death);
  }

  // Jouer le son d'action
  private playAction(type: MonsterActionType) {
    const set = this.sounds?.action?.[type];
    playSound(this.scene, set);
  }

  // Récupérer le nombre d’actions en attente
  public getPendingCount(): number {
    return this.pending.length;
  }

  // Met à jour la barre de vie du monstre
  private updateHPBar() {
    this.hpBar.clear();
    const width = 80;
    const height = 10;
    const hpRatio = Phaser.Math.Clamp(this.currentHP / this.maxHP, 0, 1);
    this.hpBar.fillStyle(0x00ff00);
    this.hpBar.fillRect(-width / 2, -60, width * hpRatio, height);
  }

  // Récupérer le prochain action
  public peekNextAction(): { type: MonsterActionType; value: number } {
    // Check d'abord si des actions sont en attente
    if (this.pending.length > 0) {
      const a = this.pending[0];
      return { type: a.type, value: a.value };
    }
    // Si aucune action en attente et qu’il reste des actions
    if (!this.actions || this.actions.length === 0) {
      return { type: 'waiting', value: 0 };
    }
    const idx = Math.min(this.actionIndex, this.actions.length - 1);
    const a = this.actions[idx];

    // Check si l'action est de type "combo"
    if (a.type === 'combo') {
      const expanded = this.expandCombo(a);
      if (expanded.length > 0) {
        // Ne pas consommer l’index tant qu'il reste des actions dans le combo
        return { type: expanded[0].type, value: expanded[0].value };
      }
      return { type: 'waiting', value: 0 };
    }

    return { type: a.type, value: a.value };
  }

  // Mettre à jour l'intention
  private emitIntentChanged() {
    const next = this.peekNextAction();
    this.emit('intent:changed', next);
  }

  // Initialiser l'intention
  public initIntent() {
    this.emitIntentChanged();
  }

  // Mettre à jour l'affichage du bouclier
  private updateShieldDisplay() {
    this.shieldText.setText(this.shield > 0 ? `🛡️ ${this.shield}` : '');
  }

  // Ajouter du bouclier
  public addShield(amount: number) {
    this.shield += amount;
    this.updateShieldDisplay();
  }

  // Faire des dégats au monstre
  public takeDamage(amount: number) {
    let damage = amount;

    if (this.shield > 0) {
      const absorbed = Math.min(this.shield, damage);
      this.shield -= absorbed;
      damage -= absorbed;
      this.updateShieldDisplay();

      this.scene.tweens.add({
        targets: this.sprite,
        tint: { from: 0xffffff, to: 0x00ffff },
        duration: 100, yoyo: true, repeat: 1
      });
    }

    if (damage > 0) {
      this.currentHP = Math.max(0, this.currentHP - damage);

      // FX visuel
      this.scene.tweens.add({
        targets: this.sprite,
        tint: { from: 0xffffff, to: 0xff0000 },
        duration: 120, yoyo: true, repeat: 2
      });
      this.scene.tweens.add({ targets: this, x: this.x - 10, duration: 50, yoyo: true, repeat: 2 });

      // Son de "hit"
      this.playHit();
    }

    this.updateHPBar();

    // Si le monstre meurt, joue le son de sa mort
    if (!this.isDead && this.currentHP <= 0) {
      this.isDead = true;
      this.playDeath();
      this.scene.events.emit('monster:dead');
    }
  }

  // Récupérer et jouer la prochaine action
  public playNextAction(): MonsterAction {
    if (this.pending.length > 0) {
      const next = this.pending.shift()!;
      this.playAction(next.type);
      this.emitIntentChanged();
      return next;
    }
    let action: MonsterAction = this.actions.length
      ? this.actions[Math.min(this.actionIndex, this.actions.length - 1)]
      : { type: 'waiting', value: 0, description: '' };

    if (action.type === 'combo') {
      const expanded = this.expandCombo(action);
      const delay = Math.max(0, action.delayMs ?? 0);
      if (expanded.length > 0) {
        this.actionIndex = (this.actionIndex + 1) % this.actions.length;
        this.pending.push(...expanded);
        const first = this.pending.shift()!;
        this.playAction(first.type);
        if (delay > 0 && this.scene?.time) {
        }
        this.emitIntentChanged();
        return first;
      } else {
        this.actionIndex = (this.actionIndex + 1) % this.actions.length;
        this.emitIntentChanged();
        return { type: 'waiting', value: 0, description: '' };
      }
    }

    if (this.actions.length > 0) {
      this.actionIndex = (this.actionIndex + 1) % this.actions.length;
    }
    this.playAction(action.type);
    this.emitIntentChanged();
    return action;
  }

  // Récupérer la vie actuelle
  public getHP(): number {
    return this.currentHP;
  }

  // Récupérer l'ancrage de la barre de vie
  public getHpBarAnchor(): Phaser.Math.Vector2 {
    const local = new Phaser.Math.Vector2(-40, -55);
    const world = this.getWorldTransformMatrix().transformPoint(local.x, local.y);
    return new Phaser.Math.Vector2(world.x, world.y);
  }

  // Changer la forme du monstre en fonction de son index
  public transformToForm(formIndex: number) {
    // console.log('[Monster] transformToForm', formIndex);
    const baseKey = this.sprite.texture.key.replace(/\d+$/, ""); 

    if (formIndex === 0) {
      this.sprite.setTexture(baseKey);
      return;
    }
    const newKey = `${baseKey}${formIndex}`;
    if (this.scene.textures.exists(newKey)) {
      this.sprite.setTexture(newKey);

      // effet visuel pour la transition
      this.scene.tweens.add({
        targets: this.sprite,
        alpha: { from: 0, to: 1 },
        duration: 400,
        ease: "Power2",
      });
    } else {
      console.warn(`[Monster] texture ${newKey} non trouvée`);
    }
  }

  // Etendre un combo pendant qu'il se joue
  private expandCombo(a: MonsterAction): MonsterAction[] {
    if (a.type !== 'combo' || !a.steps || a.steps.length === 0) return [];
    const times = Math.max(1, a.repeat ?? 1);
    const out: MonsterAction[] = [];
    for (let i = 0; i < times; i++) {
      for (const step of a.steps) {
        if (step.type === 'combo') {
          out.push(...this.expandCombo(step));
        } else {
          out.push(step);
        }
      }
    }
    return out;
  }

  // Sort Milk
  public milk(value: number) {
    this.currentHP += value;

    this.scene.tweens.add({
      targets: this.sprite,
      tint: { from: 0xffffff, to: 0x00ff00 },
      duration: 120,
      yoyo: true,
      repeat: 2
    });

    this.updateHPBar();
  }

}
