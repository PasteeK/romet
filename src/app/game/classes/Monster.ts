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

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, hp: number, actions: MonsterAction[]) {
        super(scene, x, y);
        this.maxHP = hp;
        this.currentHP = hp;
        this.actions = actions;

        this.sprite = scene.add.image(0, 10, texture);
        this.sprite.setOrigin(0.5);

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

    private updateShieldDisplay() {
        this.shieldText.setText(this.shield > 0 ? `🛡️ ${this.shield}` : '');
    }

    public addShield(amount: number) {
        this.shield += amount;
        this.updateShieldDisplay();
    }

    private isDead = false

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

            console.log(`Bouclier absorbe ${absorbed} dégâts. Reste ${this.shield} de shield.`);
        }

        if (damage > 0) {
            this.currentHP -= damage;
            if (this.currentHP < 0) this.currentHP = 0;
            console.log(`Le monstre perd ${damage} PV. PV restants : ${this.currentHP}`);

            this.scene.tweens.add({
                targets: this,
                x: this.x - 10,
                duration: 50,
                yoyo: true,
                repeat: 2
            });
        } else {
            console.log(`Aucun dégât reçu grâce au bouclier.`);
        }

        this.updateHPBar();

        if (!this.isDead && this.currentHP <= 0) {
            this.isDead = true;
            this.scene.events.emit('monster:dead');
        }
    }

    public playNextAction(): MonsterAction {
        const action = this.actions[this.actionIndex];
        this.actionIndex = (this.actionIndex + 1) % this.actions.length;
        return action;
    }

    public getHP(): number {
        return this.currentHP;
    }
}
