import { Component, AfterViewInit } from '@angular/core';
import Phaser from 'phaser';
import { Game } from '../../game/game';
import { PlayerService } from '../../services/player.service';

type TutData = {
  onComplete?: (state: 'skipped' | 'completed') => void;
  getTargetBounds?: (key: string) => Phaser.Geom.Rectangle | null;
};

@Component({
  selector: 'app-map-page',
  standalone: true,
  imports: [Game],
  template: `<div class="w-screen h-screen relative"><app-game></app-game></div>`
})
export class MapPage implements AfterViewInit {

  constructor(private player: PlayerService) {}

  ngAfterViewInit() {
    const getGame = () => (window as any).phaserGame as Phaser.Game | undefined;

    const ensureMap = () => {
      const game = getGame();
      if (!game) return false;
      const sm = game.scene;
      const active = (sm as any).isActive?.('MapScene');
      const sleeping = (sm as any).isSleeping?.('MapScene');
      if (!active && !sleeping) {
        console.log('[MapPage] starting MapScene');
        sm.start('MapScene');
      }
      return true;
    };

    const startTutorialOverlay = () => {
      const game = getGame();
      if (!game) return;

      const sm = game.scene as any;

      if (!sm.isActive?.('MapScene')) {
        sm.start('MapScene');
      }

      const mapScene: any = sm.getScene?.('MapScene');

      const tutActive = sm.isActive?.('TutorialScene');
      const tutSleeping = sm.isSleeping?.('TutorialScene');
      if (tutActive || tutSleeping) {
        sm.bringToTop?.('TutorialScene');
        return;
      }

      const data: TutData = {
        onComplete: (state) => {
          console.log('[Tutorial] finished:', state);
        },
        getTargetBounds: (key) => {
          if (mapScene?.getEventBounds) {
            return mapScene.getEventBounds(key) as Phaser.Geom.Rectangle | null;
          }
          return null;
        }
      };

      console.log('[MapPage] running TutorialScene (overlay)');
      game.scene.run('TutorialScene', data as any);
      game.scene.bringToTop?.('TutorialScene');
    };

    if (getGame()) {
      ensureMap();
      if (this.player.getTutorial()) startTutorialOverlay();
    }

    const handler = () => {
      ensureMap();
      if (this.player.getTutorial()) startTutorialOverlay();
      document.removeEventListener('phaser-ready', handler);
    };
    document.addEventListener('phaser-ready', handler);
  }
}
