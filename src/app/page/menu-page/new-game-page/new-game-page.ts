import { Component, OnInit } from '@angular/core';
import Phaser from 'phaser';
import { Game } from '../../../game/game';

@Component({
  selector: 'app-new-game-page',
  standalone: true,
  imports: [Game],
  template: `
    <div class="w-screen h-screen relative">
      <app-game></app-game>

      @if (loading) {
        <div class="absolute inset-0 flex items-center justify-center bg-black/60 text-white z-50">
          <div class="text-center">
            <div class="text-xl font-semibold">Nouvelle partie…</div>
            <div class="text-sm opacity-80 mt-2">{{ status }}</div>
          </div>
        </div>
      }
    </div>
  `
})
export class NewGamePage implements OnInit {
  loading = true;
  status = 'Initialisation…';

  async ngOnInit() {
    await this.waitPhaserReady(2000);
    const game = (window as any).phaserGame as Phaser.Game | undefined;
    if (!game) { this.status = 'Phaser non initialisé (canvas absent).'; return; }
    game.scene.start('MapScene', { forceNew: true });
    this.loading = false;
  }

  private waitPhaserReady(timeoutMs = 1500): Promise<void> {
    if ((window as any).phaserReady) return Promise.resolve();
    return new Promise(resolve => {
      const to = setTimeout(() => { document.removeEventListener('phaser-ready', handler); resolve(); }, timeoutMs);
      const handler = () => { clearTimeout(to); document.removeEventListener('phaser-ready', handler); resolve(); };
      document.addEventListener('phaser-ready', handler);
    });
  }
}
