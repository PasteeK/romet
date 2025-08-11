export class MapNode extends Phaser.GameObjects.Container {
    private background: Phaser.GameObjects.Graphics;
    private image?: Phaser.GameObjects.Image;
    private index: number;
    private isCleared = false;

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

        const hitZone = scene.add.zone(0, 0, 55, 55).setInteractive();
        this.add(hitZone);

        hitZone.on('pointerover', () => {
            if (this.isCleared) return;
            this.drawBackground(0xF7803C);
            this.setScale(1.1, 1.1);
        });

        hitZone.on('pointerout', () => {
            if (this.isCleared) return;
            this.drawBackground(0x8B1E3F);
            this.setScale(1, 1);
        });

        hitZone.on('pointerdown', () => {
            if (this.isCleared) return;
            
            this.scene.scene.launch('MainScene', { nodeIndex: this.index });

            this.scene.scene.sleep();
        });

        scene.add.existing(this);
    }

    private drawBackground(color: number) {
        this.background.clear();
        this.background.fillStyle(color, 1);
        this.background.fillRoundedRect(-27.5, -27.5, 55, 55, 10);
    }

    setCleared() {
        this.isCleared = true;
        this.background.clear();
        this.background.fillStyle(0x555555, 1);
        this.background.fillRoundedRect(-27.5, -27.5, 55, 55, 10);
        this.setAlpha(0.9);
    }
}
