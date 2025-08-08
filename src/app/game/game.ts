import { AfterViewInit, Component, ElementRef, Inject, OnDestroy, ViewChild, viewChild } from '@angular/core';
import Phaser from 'phaser';
import { MainScene } from './scenes/main.scene';
import { MapScene } from './scenes/map.scene';

@Component({
    selector: 'app-game',
    imports: [],
    templateUrl: './game.html',
    styleUrl: './game.css'
})
export class Game implements AfterViewInit, OnDestroy {
    @ViewChild('gameContainer', { static: true }) gameContainer!: ElementRef;
    phaserGame!: Phaser.Game;


    ngAfterViewInit(): void {
        const GAME_WIDTH = 1280;
        const GAME_HEIGHT = 720;

        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            backgroundColor: '#1d1d1d',

            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH,
                width: GAME_WIDTH,
                height: GAME_HEIGHT,
                parent: this.gameContainer.nativeElement
            },

            fps: {
                target: 60,
                forceSetTimeOut: true
            },

            scene: [MapScene, MainScene]
        };

        this.phaserGame = new Phaser.Game(config);
    }


    ngOnDestroy(): void {
        if (this.phaserGame) {
            this.phaserGame.destroy(true);
        }
    }
}