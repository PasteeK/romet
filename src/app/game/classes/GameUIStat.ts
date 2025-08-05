export class GameUIStat extends Phaser.GameObjects.Container {
    private bg: Phaser.GameObjects.Graphics;
    private titleText: Phaser.GameObjects.Text;
    private valueText: Phaser.GameObjects.Text;
    private separator: Phaser.GameObjects.Graphics;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        width: number,
        height: number,
        title: string,
        initialValue: string
    ) {
        super(scene, x, y);

        // Dimensions du contenu
        const titleHeight = 18;
        const valueHeight = 20;
        const lineHeight = 1;
        const spacing = 6;

        const contentHeight = titleHeight + spacing + lineHeight + spacing + valueHeight;
        const startY = (height - contentHeight) / 2;

        // Fond
        this.bg = scene.add.graphics();
        this.bg.fillStyle(0x1F0006, 0.8);
        this.bg.fillRoundedRect(0, 0, width, height, 10);
        this.bg.lineStyle(2, 0xD6A858);
        this.bg.strokeRoundedRect(0, 0, width, height, 10);

        // Titre
        this.titleText = scene.add.text(width / 2, startY, title, {
            fontFamily: 'romet',
            fontSize: `${titleHeight}px`,
            color: '#cccccc',
        }).setOrigin(0.5, 0);

        // Séparateur
        const sepY = startY + titleHeight + spacing;
        this.separator = scene.add.graphics();
        this.separator.lineStyle(lineHeight, 0xffffff, 0.3);
        this.separator.beginPath();
        this.separator.moveTo(10, sepY);
        this.separator.lineTo(width - 10, sepY);
        this.separator.strokePath();

        // Valeur
        const valueY = sepY + spacing;
        this.valueText = scene.add.text(width / 2, valueY, initialValue, {
            fontFamily: 'romet',
            fontSize: `${valueHeight}px`,
            color: '#ffffff',
        }).setOrigin(0.5, 0);

        // Ajout au container
        this.add([this.bg, this.titleText, this.separator, this.valueText]);
        scene.add.existing(this);
    }

    setValue(newValue: string) {
        this.valueText.setText(newValue);
    }
}
