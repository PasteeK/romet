import Phaser from "phaser";

export class BtnEndTurn {
    private button: Phaser.GameObjects.Rectangle;
    private text: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene, x: number, y: number, label: string = 'Fin de tour') {
        this.button = scene.add.rectangle(x, y, 100, 40, 0x1F0006)
        this.text = scene.add.text(x, y, label, {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);
    }

    onClick(callback: () => void) {
        this.button.on('pointerdown', callback);
    }

    setVisible(visible: boolean) {
        this.button.setVisible(visible);
        this.text.setVisible(visible);
    }

    setEnabled(enabled: boolean) {
        this.button.disableInteractive();
        if (enabled) {
            this.button.setInteractive({ useHandCursor: true });
        }
        this.text.setAlpha(enabled ? 1 : 0.5);
    }
}