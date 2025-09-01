const ICON_SIZE = 55;
const BOSS_ICON_SIZE = Math.round(ICON_SIZE * 2);

export class MapNode extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Graphics;
  private image?: Phaser.GameObjects.Image;
  private hitZone: Phaser.GameObjects.Zone;
  private index: number;

  private states: 'available' | 'blocked' | 'cleared' = 'blocked';

  private size: number;

  constructor(scene: Phaser.Scene, x: number, y: number, index: number, textureKey?: string) {
    super(scene, x, y);
    this.index = index;

    this.size = (this.index === 17) ? BOSS_ICON_SIZE : ICON_SIZE;

    this.background = scene.add.graphics();
    this.add(this.background);
    this.drawBackground(0x8B1E3F);

    if (textureKey) {
      this.image = scene.add.image(0, 0, textureKey)
        .setOrigin(0.5)
        .setDisplaySize(this.size, this.size); // ← taille d’affichage, pas de scale
      this.add(this.image);
    }

    // hitbox calée sur la taille (avec un tout petit padding)
    const pad = 0;
    this.hitZone = scene.add.zone(0, 0, this.size + pad, this.size + pad)
      .setOrigin(0.5)
      .setInteractive();
    this.add(this.hitZone);

    this.hitZone.on('pointerover', () => {
      if (this.states !== 'available') return;
      this.drawBackground(0xF7803C);
    });

    this.hitZone.on('pointerout', () => {
      if (this.states !== 'available') return;
      this.drawBackground(0x8B1E3F);
    });

    this.hitZone.on('pointerdown', () => {
      if (this.states !== 'available') return;
      this.scene.game.events.emit('map:nodeSelected', this.index);
    });

    scene.add.existing(this);
  }

  private drawBackground(color: number) {
    const half = this.size / 2;
    const radius = Math.min(10, half);
    this.background.clear();
    this.background.fillStyle(color, 1);
    this.background.fillRoundedRect(-half, -half, this.size, this.size, radius);
  }

  setAvailable() {
    this.states = 'available';
    this.setAlpha(1);
    this.drawBackground(0x8B1E3F);
    this.hitZone.setInteractive();
  }

  setBlocked() {
    this.states = 'blocked';
    this.setAlpha(0.9);
    this.drawBackground(0x3a3a3a);
    this.hitZone.disableInteractive();
  }

  setCleared() {
    this.states = 'cleared';
    this.setAlpha(0.9);
    this.drawBackground(0x555555);
    this.hitZone.disableInteractive();
  }

  public setTexture(key: string): this {
    if (!this.image) {
      this.image = this.scene.add.image(0, 0, key)
        .setOrigin(0.5)
        .setDisplaySize(this.size, this.size); // ← utilise la taille courante
      this.addAt(this.image, 1);
    } else {
      this.image.setTexture(key).setDisplaySize(this.size, this.size);
    }
    return this;
  }

  public setType(type: 'fight' | 'elite' | 'boss' | 'shop' | 'smoking' | 'start' | string): this {
    const key = this.mapTypeToTexture(type);
    return this.setTexture(key);
  }

  // Optionnel : permet de changer dynamiquement la taille (ex: si tu préfères lier à `type`).
  private setSizeVariant(newSize: number) {
    if (this.size === newSize) return;
    this.size = newSize;
    this.drawBackground(this.states === 'available' ? 0x8B1E3F :
                        this.states === 'blocked'   ? 0x3a3a3a : 0x555555);
    this.image?.setDisplaySize(this.size, this.size);
    this.hitZone.setSize(this.size, this.size).setOrigin(0.5);
  }

  private mapTypeToTexture(type: string): string {
    switch (type) {
      case 'fight':   return 'simple_fight';
      case 'elite':   return 'elite';
      case 'boss':    return 'boss';
      case 'shop':    return 'shop';
      case 'smoking': return 'smoking';
      case 'start':   return 'simple_fight';
      default:        return 'simple_fight';
    }
  }
}
