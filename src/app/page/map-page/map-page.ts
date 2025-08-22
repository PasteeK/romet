// map-page.ts
import { Component, AfterViewInit } from '@angular/core';
import Phaser from 'phaser';
import { Game } from '../../game/game';

@Component({
  selector: 'app-map-page',
  standalone: true,
  imports: [Game],
  template: `<div class="w-screen h-screen relative"><app-game></app-game></div>`
})
export class MapPage implements AfterViewInit {
  ngAfterViewInit() {
    const startMap = () => {
      const game = (window as any).phaserGame as Phaser.Game | undefined;
      if (!game) return;

      const sys = game.scene as any;
      const active = sys.isActive?.('MapScene');
      const sleeping = sys.isSleeping?.('MapScene');
      if (!active && !sleeping) {
        console.log('[MapPage] starting MapScene');
        game.scene.start('MapScene');
      }
    };

    if ((window as any).phaserGame) startMap();

    const handler = () => { startMap(); document.removeEventListener('phaser-ready', handler); };
    document.addEventListener('phaser-ready', handler);
  }
}
