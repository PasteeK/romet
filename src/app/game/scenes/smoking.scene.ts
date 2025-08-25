// src/app/game/scenes/smoking.scene.ts
import Phaser from "phaser";
import { SavegameService } from "../../services/savegame.service";
import { Injector } from "@angular/core";

export class SmokingScene extends Phaser.Scene {
  private saveSvc?: SavegameService;
  private saveId?: string;

  constructor() { super("SmokingScene"); }

  init(data: { saveId?: string }) {
    this.saveId = data?.saveId;

    const inj = (window as any).ngInjector as Injector | undefined;
    if (inj && typeof (inj as any).get === "function") {
      this.saveSvc = (inj as any).get(SavegameService);
    } else {
      const regSvc = this.game.registry.get("saveSvc");
      if (regSvc) this.saveSvc = regSvc as SavegameService;
    }
  }

  async create() {
    this.cameras.main.setBackgroundColor('#121212');
    this.add.text(this.scale.width/2, 80, 'Smoking Area', { fontFamily:'romet', fontSize:'42px', color:'#fff' }).setOrigin(0.5);
    this.add.text(this.scale.width/2, 120, "Smoking Area", {
      fontSize: "48px",
      color: "#fff",
      fontFamily: "romet",
    }).setOrigin(0.5);

    let heal = 0, newHp = 0, maxHp = 100;

    if (this.saveSvc && this.saveId) {
      try {
        const save: any = await this.saveSvc.getCurrent();
        const hp = save?.playerHp ?? save?.currentHp ?? save?.player?.hp ?? save?.startingHp ?? 100;
        maxHp = save?.maxHp ?? save?.player?.maxHp ?? 100;

        const missing = Math.max(0, maxHp - hp);
        heal = Math.floor(missing * 0.15);
        newHp = Math.min(maxHp, hp + heal);

        // PATCH de la run côté serveur
        await this.saveSvc.patch(this.saveId, { playerHp: newHp });

        // met à jour l’UI Map si elle est déjà en mémoire
        const map = this.scene.get('MapScene');
        map?.events.emit('hp:update', newHp);
      } catch (e) {
        console.warn("[SmokingScene] heal error:", e);
      }
    }

    this.add.text(this.scale.width/2, 220,
      `Vous faites une pause clope.\n+${heal} PV (${newHp}/${maxHp})`,
      { fontSize: "24px", color: "#0f0", fontFamily: "romet", align: 'center' }
    ).setOrigin(0.5);

    const btn = this.add.text(this.scale.width/2, this.scale.height - 120, "Retour à la carte", {
      fontSize: "28px",
      color: "#FFD700",
      fontFamily: "romet",
      backgroundColor: "#333",
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive();

    btn.on("pointerover", () => btn.setColor("#fff"));
    btn.on("pointerout", () => btn.setColor("#FFD700"));
    btn.on("pointerdown", () => {
      if (this.scene.isSleeping("MapScene")) this.scene.wake("MapScene");
      else this.scene.start("MapScene");
      this.scene.stop();
    });
  }
}
