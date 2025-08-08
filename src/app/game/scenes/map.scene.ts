import Phaser from "phaser";
import { MapNode } from "../classes/MapNode";
import { GameUI } from "../classes/GameUI";

export class MapScene extends Phaser.Scene {
    private gameUI!: GameUI;
    constructor() {
        super('MapScene');
    }

    preload() {
        this.load.image('map_bg', 'assets/images/map/map_bg.png');
        this.load.image('map', 'assets/images/map/map.png');
        this.load.image('ui_bg', 'assets/images/ui_bg.png');

        this.load.image('simple_fight', 'assets/images/events/simple_fight.png');
    }

    create() {
        document.fonts.ready.then(() => {
            this.add.image(this.scale.width / 2, this.scale.height / 2, 'map_bg')
                .setDisplaySize(this.scale.width, this.scale.height);
                
            this.add.image(0, 0, 'ui_bg')
                    .setOrigin(0.5)
                    .setScale(1.25, 1.5);
    
            // Création de l'UI
                        this.gameUI = new GameUI(this);
                        this.gameUI.setHP(100);
                        this.gameUI.setGold(0);
                        this.gameUI.setDiscard(0);
                        this.gameUI.setScore('', 0);
    
            const map = this.add.image(this.scale.width / 1.625, this.scale.height / 2, 'map')
    
            const originalWidth = map.width;
            const originalHeight = map.height;
    
            const scaleX = this.scale.width / originalWidth;
            const scaleY = this.scale.height / originalHeight;
    
            const scale = Math.min(scaleX, scaleY);
    
            map.setScale(scale);
    
    
    
            const nodePositions = [
                { x: 583, y: 548 },
                { x: 787.5, y: 548 },
                { x: 992, y: 548 },
    
                { x: 445, y: 410 },
                { x: 583, y: 410 },
                { x: 718.5, y: 410 },
                { x: 855, y: 410 },
                { x: 995, y: 410 },
                { x: 1131, y: 410 },
    
                { x: 445, y: 272.5 },
                { x: 650.75, y: 272.5 },
                { x: 925, y: 272.5 },
                { x: 1131, y: 272.5 },
    
                { x: 445, y: 135 },
                { x: 650.75, y: 135 },
                { x: 925, y: 135 },
                { x: 1131, y: 135 },
            ]
    
            nodePositions.forEach((pos, i) => {
                const node = new MapNode(this, pos.x, pos.y, i, 'simple_fight');
            });
        });
    };    
}