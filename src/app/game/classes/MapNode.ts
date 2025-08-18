export class MapNode extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Graphics;
  private image?: Phaser.GameObjects.Image;
  private hitZone: Phaser.GameObjects.Zone;
  private index: number;

  private states: 'available' | 'blocked' | 'cleared' = 'blocked';

  constructor(scene: Phaser.Scene, x: number, y: number, index: number, textureKey?: string) {
    super(scene, x, y);
    this.index = index;

    this.background = scene.add.graphics();
    this.add(this.background);
    this.drawBackground(0x8B1E3F);

    if (textureKey) {
      this.image = scene.add.image(0, 0, textureKey).setDisplaySize(55, 55);
      this.add(this.image);
    }

    this.hitZone = scene.add.zone(0, 0, 55, 55).setInteractive();
    this.add(this.hitZone);

    this.hitZone.on('pointerover', () => {
      if (this.states !== 'available') return;
      this.drawBackground(0xF7803C);
      this.setScale(1.1, 1.1);
    });

    this.hitZone.on('pointerout', () => {
      if (this.states !== 'available') return;
      this.drawBackground(0x8B1E3F);
      this.setScale(1, 1);
    });

    this.hitZone.on('pointerdown', () => {
      if (this.states !== 'available') return;

      this.scene.game.events.emit('map:nodeSelected', this.index);
    });

    scene.add.existing(this);
  }

  private drawBackground(color: number) {
    this.background.clear();
    this.background.fillStyle(color, 1);
    this.background.fillRoundedRect(-27.5, -27.5, 55, 55, 10);
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
}
