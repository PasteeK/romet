const ICON_SIZE = 55;
const BOSS_ICON_SIZE = Math.round(ICON_SIZE * 2);

// Affichage des "noeuds" (les evenements) sur la carte
export class MapNode extends Phaser.GameObjects.Container {
  // variables
  private background: Phaser.GameObjects.Graphics;
  private image?: Phaser.GameObjects.Image;
  private hitZone: Phaser.GameObjects.Zone;
  private index: number;

  private states: 'available' | 'blocked' | 'cleared' = 'blocked';

  private size: number;

  constructor(scene: Phaser.Scene, x: number, y: number, index: number, textureKey?: string) {
    super(scene, x, y);
    this.index = index;

    // Taille des icones
    this.size = (this.index === 17) ? BOSS_ICON_SIZE : ICON_SIZE;

    // Fond
    this.background = scene.add.graphics();
    this.add(this.background);
    this.drawBackground(0x8B1E3F);

    // Image
    if (textureKey) {
      this.image = scene.add.image(0, 0, textureKey)
        .setOrigin(0.5)
        .setDisplaySize(this.size, this.size);
      this.add(this.image);
    }

    // hitbox calée sur la taille (avec un tout petit padding sinon c'est moche)
    const pad = 0;
    this.hitZone = scene.add.zone(0, 0, this.size + pad, this.size + pad)
      .setOrigin(0.5)
      .setInteractive();
    this.add(this.hitZone);

    // Interactions
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

  // Dessin du fond autour de l'icone
  private drawBackground(color: number) {
    const half = this.size / 2;
    const radius = Math.min(10, half);
    this.background.clear();
    this.background.fillStyle(color, 1);
    this.background.fillRoundedRect(-half, -half, this.size, this.size, radius);
  }

  // Set l'evenement comme disponible
  setAvailable() {
    this.states = 'available';
    this.setAlpha(1);
    this.drawBackground(0x8B1E3F);
    this.hitZone.setInteractive();
  }

  // Set l'evenement comme bloqué
  setBlocked() {
    this.states = 'blocked';
    this.setAlpha(0.9);
    this.drawBackground(0x3a3a3a);
    this.hitZone.disableInteractive();
  }

  // Set l'evenement comme complété
  setCleared() {
    this.states = 'cleared';
    this.setAlpha(0.9);
    this.drawBackground(0x555555);
    this.hitZone.disableInteractive();
  }

  // Set l'image si disponible
  public setTexture(key: string): this {
    if (!this.image) {
      this.image = this.scene.add.image(0, 0, key)
        .setOrigin(0.5)
        .setDisplaySize(this.size, this.size);
      this.addAt(this.image, 1);
    } else {
      this.image.setTexture(key).setDisplaySize(this.size, this.size);
    }
    return this;
  }

  // Set le type d'evenement parmis ceux disponibles
  public setType(type: 'fight' | 'elite' | 'boss' | 'shop' | 'smoking' | 'start' | string): this {
    const key = this.mapTypeToTexture(type);
    return this.setTexture(key);
  }

  // Associe automatiquement le type d'evenement au bon sprite
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
