import { Injectable } from '@angular/core';
import { PlayerService } from './player.service';
import { firstValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class StartGameService {
  constructor(private playerSvc: PlayerService) {}

  async startNewRun(game: Phaser.Game) {
    await this.waitGameReady(game);

    if (!game.scene.keys['TutorialScene']) {
    }

    const me = await firstValueFrom(
      this.playerSvc.getMe().pipe(catchError(() => of(null)))
    );

    const show = me?.preferences?.showTutorial ?? true;

    if (show) {
      game.scene.start('TutorialScene', {
        onComplete: async (_: 'skipped' | 'completed') => {
          await firstValueFrom(this.playerSvc.setTutorial('disable').pipe(catchError(() => of(null))));
          const main = game.scene.getScene('MainScene');
          main?.events?.emit('tutorial:done', _);
        }
      });

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
