import { AfterViewInit, Component, ElementRef, Inject, OnDestroy, ViewChild, viewChild } from '@angular/core';
import Phaser from 'phaser';
import { MainScene } from './scenes/main.scene';

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
      const config: Phaser.Types.Core.GameConfig = {
          type: Phaser.AUTO,
          width: 800,
          height: 600,
          backgroundColor: '#1d1d1d',
          parent: this.gameContainer.nativeElement,
          scene: [MainScene]
      };

      this.phaserGame = new Phaser.Game(config);
  }

  ngOnDestroy(): void {
      if (this.phaserGame) {
          this.phaserGame.destroy(true);
      }
  }
}