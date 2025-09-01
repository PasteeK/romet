import Phaser from 'phaser';
import { Injector } from '@angular/core';
import { SavegameService } from '../../services/savegame.service';

export class SmokingScene extends Phaser.Scene {
  private saveSvc?: SavegameService;
  private saveId?: string;

  constructor() { super('SmokingScene'); }

  init(data: { saveId?: string }) {
    this.saveId = data?.saveId || this.game.registry.get('saveId');

    const inj = (window as any).ngInjector;
    if (inj && typeof inj.get === 'function') {
      this.saveSvc = inj.get(SavegameService);
    } else {
      const regSvc = this.game.registry.get('saveSvc');
      if (regSvc) this.saveSvc = regSvc as SavegameService;
    }
  }

  preload() {
    this.load.image('smokingBG', 'assets/images/smoking.png');
    this.load.image('pointerRight', 'assets/icons/pointerRight.png');
  }

  create() {
    // UI
    this.add.image(this.scale.width/2, this.scale.height/2, 'smokingBG').setOrigin(0.5);
    this.add.text(this.scale.width/2, this.scale.height/2 - 200, 'Zone Fumeur', {
      color: '#ffffff', fontSize: '48px', fontFamily: 'romet'
    }).setOrigin(0.5);

    const btn = this.add.text(this.scale.width/2, this.scale.height/2 + 200,
      "S'en griller une. (+15% des PV manquants)", { color: '#F7A03C', fontSize: '32px', fontFamily: 'romet' }
    ).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    btn.on('pointerup', () => {
      this.cameras.main.fadeOut(1500, 0, 0, 0);
      setTimeout(() => {
        this.applyHealAndReturn();
      }, 1500);
    })

    let pointer: Phaser.GameObjects.Image | null = null;

    btn.on('pointerover', () => {
      btn.setStyle({ color: '#ffffff' });
      btn.setScale(1.1);
      if (pointer) {
        pointer.destroy();
      }
      pointer = this.add.image(btn.x - 380, btn.y, 'pointerRight').setOrigin(0.5);
    });

    btn.on('pointerout', () => {
      btn.setStyle({ color: '#F7A03C' });
      btn.setScale(1);

      if (pointer) {
        pointer.destroy();
        pointer = null;
      }
    });

  }

  // Mise à jour des PV
  private async applyHealAndReturn() {
    if (!this.saveSvc || !this.saveId) {
      this.exitToMap();
      return;
    }

    try {
      const save: any = await this.saveSvc.getCurrent();
      const max  = save?.maxHp ?? save?.player?.maxHp ?? 100;
      const cur  = save?.playerHp ?? save?.currentHp ?? save?.player?.hp ?? save?.startingHp ?? max;

      const missing = Math.max(0, max - cur);
      const healed  = Math.ceil(missing * 0.15);
      const newHp   = Math.min(max, cur + healed);

      const map = this.scene.get('MapScene');
      map?.events.emit('hp:update', newHp);

      try {
        await this.saveSvc.saveStats(this.saveId, { playerHp: newHp });
      } catch (err) {
        console.warn('[SmokingScene] PATCH /savegames/:id a échoué → heal non persistant après refresh.', err);
      }

      (map as any)?.refreshFromServer?.();

    } catch (e) {
      console.warn('[SmokingScene] heal error (getCurrent ou calcul):', e);
    } finally {
      this.exitToMap();
    }
  }


  // Retour au menu
  private exitToMap() {
    this.scene.stop();
    this.scene.wake('MapScene');
    this.scene.bringToTop('MapScene');
  }
}
