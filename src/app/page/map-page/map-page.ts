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

      // S'assurer que la Map tourne (pour pouvoir récupérer ses bounds)
      if (!sm.isActive?.('MapScene')) {
        sm.start('MapScene');
      }

      const mapScene: any = sm.getScene?.('MapScene');

      // Éviter de relancer si déjà actif/dormi
      const tutActive = sm.isActive?.('TutorialScene');
      const tutSleeping = sm.isSleeping?.('TutorialScene');
      if (tutActive || tutSleeping) {
        sm.bringToTop?.('TutorialScene');
        return;
      }

      const data: TutData = {
        onComplete: (state) => {
          console.log('[Tutorial] finished:', state);
          // Exemple: marquer tuto comme terminé côté profil
          // this.player.setTutorial(false);
        },
        getTargetBounds: (key) => {
          if (mapScene?.getEventBounds) {
            return mapScene.getEventBounds(key) as Phaser.Geom.Rectangle | null;
          }
          return null;
        }
      };

      // ⚠️ Utiliser run(...) (tapé) pour overlay (équivalent pratique à launch)
      console.log('[MapPage] running TutorialScene (overlay)');
      game.scene.run('TutorialScene', data as any);
      game.scene.bringToTop?.('TutorialScene');
    };

    // Si le jeu est déjà injecté dans window
    if (getGame()) {
      ensureMap();
      if (this.player.getTutorial()) startTutorialOverlay();
    }

    // Sinon, attendre l'event custom "phaser-ready"
    const handler = () => {
      ensureMap();
      if (this.player.getTutorial()) startTutorialOverlay();
      document.removeEventListener('phaser-ready', handler);
    };
    document.addEventListener('phaser-ready', handler);
  }
}
