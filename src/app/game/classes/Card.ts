import Phaser from "phaser";

export class Card extends Phaser.GameObjects.Container {
    public wasClicked = false;
    public hasDragged = false;

    public value: string;
    public suit: string;    

    private originalPosition: { x: number; y: number };
    private highlight: Phaser.GameObjects.Rectangle;
    private background: Phaser.GameObjects.Image;

    constructor(scene: Phaser.Scene, x: number, y: number, value: string, type: string) {
        super(scene, x, y);

        const spriteKey = `${type}_${value}`;
        this.background = scene.add.image(0, 0, spriteKey).setDisplaySize(100, 125);

        this.highlight = scene.add.rectangle(0, 0, 98, 123);
        this.highlight.setStrokeStyle(1.5, 0xffd700, 0.75);
        this.highlight.setVisible(false);

        this.add([this.background, this.highlight]);
        this.setSize(100, 125);

        this.setInteractive();
        scene.input.setDraggable(this);

        this.value = value;
        this.suit = type;

        // Hover
        this.on('pointerover', () => {
            this.highlight.setVisible(true);
        });

        this.on('pointerout', () => {
            this.highlight.setVisible(false);
        });
        
        // Drag
        this.on('dragstart', () => {
            this.setScale(1.15);
        })

        this.on('dragend', () => {
            this.setScale(1);
        })

        this.originalPosition = { x, y };
        scene.add.existing(this);
    }

    resetPosition() {
        this.setPosition(this.originalPosition.x, this.originalPosition.y);
    }

    setOriginalPosition(x: number, y: number) {
        this.originalPosition = { x, y };
    }

    getValue(): string {
        return this.value;
    }

    getSuit(): string {
        return this.suit;
    }
}
