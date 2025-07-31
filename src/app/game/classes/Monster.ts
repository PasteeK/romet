import Phaser from "phaser";

export class Monster extends Phaser.GameObjects.Container {
    private hpBar: Phaser.GameObjects.Graphics;
    private maxHP: number;
    private currentHP: number;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, hp: number) {
        super(scene, x, y);
        this.maxHP = hp;
        this.currentHP = hp;

        const sprite = texture ? scene.add.image(0, 10, texture) : scene.add.image(0, 0, 'monster');
        this.hpBar = scene.add.graphics();
        this.updateHPBar();

        this.add([sprite, this.hpBar]);
        scene.add.existing(this);
    }

    updateHPBar() {
        this.hpBar.clear();
        const width = 80;
        const height = 10;
        const hpRatio = this.currentHP / this.maxHP;
        this.hpBar.fillStyle(0x00ff00);
        this.hpBar.fillRect(-width / 2, -60, width * hpRatio, height);
    }
}