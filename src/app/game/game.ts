import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import Phaser from 'phaser';
import { MainScene } from './scenes/main.scene';
import { MapScene } from './scenes/map.scene';
import { SavegameService } from '../services/savegame.service';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [],
  templateUrl: './game.html',
  styleUrl: './game.css'
})
export class Game implements AfterViewInit, OnDestroy {
  @ViewChild('gameContainer', { static: true }) gameContainer!: ElementRef;
  phaserGame!: Phaser.Game;

  constructor(private saveSvc: SavegameService) {}

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
      fps: { target: 60, forceSetTimeOut: true },
      scene: [] // ⬅️ aucune scène auto-démarrée
    };

    this.phaserGame = new Phaser.Game(config);

    // Ajout manuel des scènes, actives = false
    this.phaserGame.scene.add('MapScene', MapScene, false);
    this.phaserGame.scene.add('MainScene', MainScene, false);

    // Registry: service pour les scènes
    this.phaserGame.registry.set('saveSvc', this.saveSvc);

    // Expo globale
    (window as any).phaserGame = this.phaserGame;
    (window as any).phaserReady = true;
    document.dispatchEvent(new Event('phaser-ready'));
  }

  ngOnDestroy(): void {
    if (this.phaserGame) this.phaserGame.destroy(true);
    delete (window as any).phaserGame;
    delete (window as any).phaserReady;
  }
}
