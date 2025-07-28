import Phaser from "phaser";

export class Card extends Phaser.GameObjects.Container {
    constructor(scene: Phaser.Scene, x: number, y: number, label: string) {
        super(scene, x, y);

        const background = scene.add.rectangle(0, 0, 100, 150, 0x4444aa).setStrokeStyle(2, 0xffffff);
        const text = scene.add.text(0, 0, label, { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);

        this.add([background, text]);
        this.setSize(100, 150);

        this.setInteractive(new Phaser.Geom.Rectangle(-50, -75, 100, 150), Phaser.Geom.Rectangle.Contains);
        scene.add.existing(this);
    }
}