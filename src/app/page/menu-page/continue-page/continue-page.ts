import { Component, OnInit } from '@angular/core';
import Phaser from 'phaser';
import { Game } from '../../../game/game';
import { SavegameDTO, SavegameService } from '../../../services/savegame.service';

@Component({
  selector: 'app-continue-page',
  standalone: true,
  imports: [Game],
  template: `
    <div class="w-screen h-screen relative">
      <app-game></app-game>
      @if (loading) {
        <div class="absolute inset-0 flex items-center justify-center bg-black/60 text-white z-50">
          <div class="text-center">
            <div class="text-xl font-semibold">Chargement de la partie…</div>
            <div class="text-sm opacity-80 mt-2">{{ status }}</div>
          </div>
        </div>
      }
    </div>
  `
})
export class ContinuePage implements OnInit {
  loading = true;
  status = 'Récupération de la sauvegarde…';

  constructor(private saveSvc: SavegameService) {}

  async ngOnInit() {
    await this.waitPhaserReady();
    const game = (window as any).phaserGame as Phaser.Game | undefined;
    if (!game) { this.status = 'Phaser non initialisé.'; return; }

    try {
      const save = await this.saveSvc.getCurrent();
      if (!save) { this.status = 'Aucune sauvegarde trouvée.'; return; }

      if (this.isCombatActive(save)) {
        game.scene.start('MainScene', { resumeFromSave: true, saveId: save._id });
      } else {
        game.scene.start('MapScene'); // pas de forceNew → reprend la run
      }
      this.loading = false;
    } catch {
      this.status = 'Erreur : impossible de charger la sauvegarde.';
    }
  }

  private isCombatActive(s: SavegameDTO | null | undefined): boolean {
    const c: any = s?.combat;
    if (!c) return false;
    if (typeof c.active === 'boolean') return c.active === true;
    if (typeof c.status === 'string') {
      const st = c.status.toLowerCase();
      return st === 'active' || st === 'ongoing' || st === 'started';
    }
    if ('finishedAt' in c) return !c.finishedAt;
    if ('ended' in c) return !c.ended;
    return false;
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