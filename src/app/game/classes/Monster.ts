import Phaser from "phaser";

export type MonsterActionType =
  'attack' |
  'defend' |
  'heal' |
  'buff' |
  'debuff' |
  'waiting' |
  'StealPercent';

export interface MonsterAction {
  type: MonsterActionType;
  value: number;
  description: string;
}

export class Monster extends Phaser.GameObjects.Container {
  private hpBar: Phaser.GameObjects.Graphics;
  private maxHP: number;
  private currentHP: number;
  private shield: number = 0;
  private shieldText!: Phaser.GameObjects.Text;

  private actions: MonsterAction[] = [];
  private actionIndex: number = 0;

  private sprite!: Phaser.GameObjects.Image;
  private isDead = false;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, hp: number, actions: MonsterAction[]) {
    super(scene, x, y);
    this.maxHP = hp;
    this.currentHP = hp;
    this.actions = actions;

    this.sprite = scene.add.image(0, 10, texture).setOrigin(0.5);

    this.hpBar = scene.add.graphics();
    this.updateHPBar();

    this.shieldText = scene.add.text(0, -this.sprite.height / 2 - 20, '', {
      fontSize: '16px',
      color: '#00ffff',
      fontFamily: 'romet',
      backgroundColor: 'rgba(0,0,0,0)',
      padding: { x: 6, y: 2 },
    }).setOrigin(0.5);

    this.add([this.sprite, this.hpBar, this.shieldText]);
    scene.add.existing(this);
  }

  private updateHPBar() {
    this.hpBar.clear();
    const width = 80;
    const height = 10;
    const hpRatio = Phaser.Math.Clamp(this.currentHP / this.maxHP, 0, 1);
    this.hpBar.fillStyle(0x00ff00);
    this.hpBar.fillRect(-width / 2, -60, width * hpRatio, height);
  }

  public peekNextAction(): { type: MonsterActionType; value: number } {
    if (!this.actions || this.actions.length === 0) {
      return { type: 'waiting', value: 0 };
    }
    const idx = Math.min(this.actionIndex, this.actions.length - 1);
    const a = this.actions[idx];
    return { type: a.type, value: a.value };
  }

  private emitIntentChanged() {
    const next = this.peekNextAction();
    this.emit('intent:changed', next);
  }

  public initIntent() {
    this.emitIntentChanged();
  }

  private updateShieldDisplay() {
    this.shieldText.setText(this.shield > 0 ? `🛡️ ${this.shield}` : '');
  }

  public addShield(amount: number) {
    this.shield += amount;
    this.updateShieldDisplay();
  }

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
        duration: 100,
        yoyo: true,
        repeat: 1
      });
    }

    if (damage > 0) {
      this.currentHP = Math.max(0, this.currentHP - damage);

      this.scene.tweens.add({
        targets: this,
        x: this.x - 10,
        duration: 50,
        yoyo: true,
        repeat: 2
      });
    }

    this.updateHPBar();

    if (!this.isDead && this.currentHP <= 0) {
      this.isDead = true;
      this.scene.events.emit('monster:dead');
    }
  }

  public playNextAction(): MonsterAction {
    const action: MonsterAction = this.actions.length
      ? this.actions[Math.min(this.actionIndex, this.actions.length - 1)]
      : { type: 'waiting', value: 0, description: '' };

    if (this.actions.length > 0) {
      this.actionIndex = (this.actionIndex + 1) % this.actions.length;
    }

    this.emitIntentChanged();
    return action;
  }

  public getHP(): number {
    return this.currentHP;
  }

  public getHpBarAnchor(): Phaser.Math.Vector2 {
    const local = new Phaser.Math.Vector2(-40, -55);
    const world = this.getWorldTransformMatrix().transformPoint(local.x, local.y);
    return new Phaser.Math.Vector2(world.x, world.y);
  }
}
