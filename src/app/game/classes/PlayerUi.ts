import Phaser from "phaser";

export class PlayerUi {
    private textObjects: Phaser.GameObjects.Text[] = [];

    constructor(scene: Phaser.Scene) {
        const labels = [
            'PV: 80',
            'Or: 50',
            'Deck: 12',
            'Défausse: 4'
        ];

        labels.forEach((label, index) => {
            const text = scene.add.text(100, 50 + index * 30, label, {
                fontSize: '16px',
                color: '#ffffff'
            });
            this.textObjects.push(text);
        })
    }
}