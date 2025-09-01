// start-game.service.ts
import { Injectable } from '@angular/core';
import { PlayerService } from './player.service';
import { firstValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class StartGameService {
  constructor(private playerSvc: PlayerService) {}

  async startNewRun(game: Phaser.Game) {
    await this.waitGameReady(game);

    // ⚠️ Important : s'assurer que la scène est bien connue de Phaser
    if (!game.scene.keys['TutorialScene']) {
      // Si tu as exporté la classe, importe-la ici et ajoute-la :
      // game.scene.add('TutorialScene', new TutorialScene(), false);
      // OU si tu utilises la classe directement :
      // game.scene.add('TutorialScene', TutorialScene, false);
    }

    // Récupérer le joueur (gérer 401/erreurs)
    const me = await firstValueFrom(
      this.playerSvc.getMe().pipe(catchError(() => of(null)))
    );

    // Fallback: si préférences absentes, on considère que le tuto DOIT s'afficher
    const show = me?.preferences?.showTutorial ?? true;

    if (show) {
      game.scene.start('TutorialScene', {
        onComplete: async (_: 'skipped' | 'completed') => {
          await firstValueFrom(this.playerSvc.setTutorial('disable').pipe(catchError(() => of(null))));
          // Si besoin : signaler à MainScene que le tuto est fini
          const main = game.scene.getScene('MainScene');
          main?.events?.emit('tutorial:done', _);
        }
      });

      // S'assurer qu’il est au-dessus (ordre de rendu)
      game.scene.bringToTop('TutorialScene');
    }
  }

  private waitGameReady(game: Phaser.Game) {
    return new Promise<void>(resolve => {
      if ((game as any).isBooted) return resolve();
      game.events.once(Phaser.Core.Events.READY, () => resolve());
    });
  }
}
