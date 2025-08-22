import Phaser from "phaser";
import { MapNode } from "../classes/MapNode";
import { GameUI } from "../classes/GameUI";

import { Injector } from "@angular/core";
import { SavegameService, SavegameDTO, MapNodeDTO } from "../../services/savegame.service";

export class MapScene extends Phaser.Scene {
  private gameUI!: GameUI;
  private nodes: MapNode[] = [];

  private saveSvc?: SavegameService;
  private save: SavegameDTO | null = null;

  private forceNew = false;
  private storageRunIdKey = 'romet.currentRunId.v1';
  private storageForceOnce = 'romet.forceNew.once.v1';

  // legacy local
  private storageClearedKey = 'romet.clearedNodes.v1';
  private storageChoiceKey  = 'romet.pathChoices.v1';
  private clearedSet = new Set<number>();
  private choices: Record<number, number> = {};

  private readonly LAYERS: number[][] = [
    [0, 1, 2],
    [3, 4, 5, 6, 7, 8],
    [9, 10, 11, 12],
    [13, 14, 15, 16],
  ];

  private readonly EDGES: Record<number, number[]> = {
    0: [3, 4],
    1: [5, 6],
    2: [7, 8],
    3: [9],
    4: [10],
    5: [10],
    6: [11],
    7: [11],
    8: [12],
    9:  [13],
    10: [14],
    11: [15],
    12: [16],
    13: [], 14: [], 15: [], 16: [],
  };

  private PARENTS: Record<number, number[]> = {};

  constructor() { super('MapScene'); }

  init(data?: { clearedNodes?: number[]; forceNew?: boolean }) {
    const inj = (window as any).ngInjector as Injector | undefined;
    if (inj && typeof (inj as any).get === 'function') {
      this.saveSvc = (inj as any).get(SavegameService);
    } else {
      const regSvc = this.game.registry.get('saveSvc');
      if (regSvc) this.saveSvc = regSvc as SavegameService;
      else console.warn('[MapScene] SavegameService introuvable → mode offline.');
    }

    // One-shot 'nouvelle partie'
    const once = sessionStorage.getItem(this.storageForceOnce) === '1';
    this.forceNew = once

    this.buildParents();
    this.loadPersistence();
    (data?.clearedNodes ?? []).forEach(i => this.clearedSet.add(i));
    this.saveCleared();
  }

  preload() {
    this.load.image('map_bg', 'assets/images/map/map_bg.png');
    this.load.image('map', 'assets/images/map/map.png');
    this.load.image('ui_bg', 'assets/images/ui_bg.png');
    this.load.image('simple_fight', 'assets/images/events/simple_fight.png');
  }

  private async waitFontsSafely(timeoutMs = 1200): Promise<void> {
    try {
      const fonts: any = (document as any).fonts;
      if (fonts?.ready) {
        await Promise.race([fonts.ready, new Promise<void>(r => setTimeout(r, timeoutMs))]);
      }
    } catch { /* ignore */ }
  }

  async create() {
    await this.waitFontsSafely(1200);

    // Décor + UI
    this.add.image(this.scale.width / 2, this.scale.height / 2, 'map_bg')
      .setDisplaySize(this.scale.width, this.scale.height);
    this.add.image(0, 0, 'ui_bg').setOrigin(0.5).setScale(1.25, 1.5);

    this.gameUI = new GameUI(this);
    this.gameUI.setDiscard(0);
    this.gameUI.setScore('', 0);

    // Map visuelle
    const map = this.add.image(this.scale.width / 1.625, this.scale.height / 2, 'map');
    const scale = Math.min(this.scale.width / map.width, this.scale.height / map.height);
    map.setScale(scale);

    // Noeuds visuels (index 0..16)
    const nodePositions = [
      { x: 583, y: 548 },   { x: 787.5, y: 548 }, { x: 992, y: 548 },
      { x: 445, y: 410 },   { x: 583, y: 410 },   { x: 718.5, y: 410 },
      { x: 855, y: 410 },   { x: 995, y: 410 },   { x: 1131, y: 410 },
      { x: 445, y: 272.5 }, { x: 650.75, y: 272.5 }, { x: 925, y: 272.5 }, { x: 1131, y: 272.5 },
      { x: 445, y: 135 },   { x: 650.75, y: 135 },   { x: 925, y: 135 },   { x: 1131, y: 135 },
    ];
    nodePositions.forEach((pos, i) => {
      const node = new MapNode(this, pos.x, pos.y, i, 'simple_fight');
      node.setBlocked();
      this.nodes[i] = node;
    });

    if (!this.saveSvc) {
      this.nodes[0]?.setAvailable();
      this.nodes[1]?.setAvailable();
      this.nodes[2]?.setAvailable();
      return;
    }

    try {
      if (this.forceNew) {
        const mapNodes = this.generateMapNodes(nodePositions);
        this.save = await this.saveSvc.start({
          seed: Date.now(),
          difficulty: 'normal',
          mapNodes,
          startNodeId: 'start',
          startingHp: 100,
          maxHp: 100,
        });

        // Consomme le flag one-shot + mémorise la run
        sessionStorage.removeItem(this.storageForceOnce);
        try { localStorage.setItem(this.storageRunIdKey, this.save._id); } catch {}
        this.forceNew = false; // one-shot consommé
      } else {
        this.save = await this.saveSvc.getCurrent();
        if (!this.save) {
          const mapNodes = this.generateMapNodes(nodePositions);
          this.save = await this.saveSvc.start({
            seed: Date.now(),
            difficulty: 'normal',
            mapNodes,
            startNodeId: 'start',
            startingHp: 100,
            maxHp: 100,
          });

          // Consomme le flag one-shot + mémorise la run
          sessionStorage.removeItem(this.storageForceOnce);
          try { localStorage.setItem(this.storageRunIdKey, this.save._id); } catch {}
          this.forceNew = false;
        } else {
          // Si on n'a PAS démarré une nouvelle partie, nettoie le flag one-shot s'il traînait
          sessionStorage.removeItem(this.storageForceOnce);
        }
      }

      console.log('[SAVE] currentNodeId =', this.save.currentNodeId);

      // Si un combat existe et n'est pas explicitement terminé → on reprend
      if (this.isCombatActive(this.save)) {
        this.game.registry.set('saveId', this.save._id);
        this.scene.launch('MainScene', { resumeFromSave: true, saveId: this.save._id });
        this.scene.sleep();
        return;
      }

      this.applySaveToNodes(this.save);
      this.applySaveStatsToUI(this.save);
      this.wireNodeClicks();
    } catch (e: any) {
      console.warn('[MapScene] Erreur API:', e?.error || e);
      if (e?.status === 401) {
        this.add.text(this.scale.width/2, 40, 'Non connecté (401).', { color: '#fff' }).setOrigin(0.5);
      }
    }

    // Sync instantanée depuis la scène combat
    this.events.on('hp:update', (hp: number) => {
      this.gameUI.setHP(hp);
      if (this.save) {
        (this.save as any).playerHp = hp;
        (this.save as any).currentHp = hp;
      }
    });

    this.events.on('gold:update', (gold: number) => {
      this.gameUI.setGold(gold);
    });

    this.events.on(Phaser.Scenes.Events.WAKE, this.refreshFromServer);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('map:nodeSelected');
      this.events.off(Phaser.Scenes.Events.WAKE, this.refreshFromServer);
    });
  }

  /**
   * Combat ACTIF = on reprend.
   * Règle: s'il y a un objet combat → on considère actif SAUF si le back indique clairement la fin.
   */
  private isCombatActive(s: SavegameDTO | null | undefined): boolean {
    const c: any = s?.combat;
    if (!c) return false;

    // 1) flags explicites de fin
    if (c.ended === true) return false;
    if (c.finished === true) return false;
    if (c.finishedAt) return false;
    if (typeof c.result === 'string' && c.result.length) return false;

    // 2) status/state textuels
    const status = String(c.status ?? c.state ?? '').toLowerCase();
    if (['ended', 'finished', 'over', 'resolved', 'victory', 'defeat'].includes(status)) return false;

    // 3) sinon => on part du principe qu'il est actif
    return true;
  }

  // ---------- Helpers serveur

  private generateMapNodes(positions: {x:number;y:number}[]): MapNodeDTO[] {
    const nodes: MapNodeDTO[] = positions.map((p, i) => ({
      id: `n${i}`,
      x: p.x, y: p.y,
      type: i >= 13 ? 'boss' : 'fight',
      neighbors: (this.EDGES[i] || []).map(j => `n${j}`),
      state: i <= 2 ? 'available' : 'locked',
    }));

    nodes.push({
      id: 'start',
      x: 0, y: 0,
      type: 'start',
      neighbors: ['n0', 'n1', 'n2'],
      state: 'cleared',
    });

    return nodes;
  }

  private applySaveToNodes(save: SavegameDTO) {
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      if (!node) continue;

      const id = `n${i}`;
      const dto = save.mapNodes.find((n: MapNodeDTO) => n.id === id);
      if (!dto) { node.setBlocked(); continue; }

      if (dto.state === 'cleared') node.setCleared();
      else if (dto.state === 'available') node.setAvailable();
      else node.setBlocked();
    }

    const cur = save.mapNodes.find((n: MapNodeDTO) => n.id === save.currentNodeId);
    const allowed = new Set<string>(cur?.neighbors ?? []);

    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      if (!node) continue;

      const id = `n${i}`;
      const dto = save.mapNodes.find((n: MapNodeDTO) => n.id === id);
      if (!dto) continue;

      if (dto.state === 'available' && !allowed.has(id)) node.setBlocked();
    }

    if (cur?.id?.startsWith('n')) {
      const idx = Number(cur.id.slice(1));
      if (!Number.isNaN(idx)) this.nodes[idx]?.setCleared();
    }
  }

  private refreshFromServer = async () => {
    if (!this.saveSvc) return;
    try {
      this.save = await this.saveSvc.getCurrent();
      if (this.isCombatActive(this.save)) {
        // si on revient d'un back navigateur sur un combat encore actif → relance auto
        if (this.save?._id) {
          this.game.registry.set('saveId', this.save._id);
        }
        this.scene.launch('MainScene', { resumeFromSave: true, saveId: this.save!._id });
        this.scene.sleep();
        return;
      }
      if (this.save) {
        this.applySaveToNodes(this.save);
        this.applySaveStatsToUI(this.save);
      }
    } catch (e) {
      console.warn('[MapScene] refreshFromServer error:', e);
    }
  };

  private applySaveStatsToUI(save: SavegameDTO) {
    const hp =
      (save as any).playerHp ??
      (save as any).currentHp ??
      (save as any).player?.hp ??
      (save as any).startingHp ??
      100;

    this.gameUI.setHP(hp);

    if (typeof (this.gameUI as any).setMaxHP === 'function') {
      const max =
        (save as any).maxHp ??
        (save as any).player?.maxHp ??
        100;
      (this.gameUI as any).setMaxHP(max);
    }
  }

  private wireNodeClicks() {
    this.game.events.on('map:nodeSelected', async (index: number) => {
      if (!this.save || !this.saveSvc) return;

      const targetId = `n${index}`;
      const nodeDTO = this.save.mapNodes.find((n: MapNodeDTO) => n.id === targetId);
      if (!nodeDTO || nodeDTO.state !== 'available') return;

      if (this.save.currentNodeId === targetId) {
        console.log('[MapScene] déjà sur', targetId);
        return;
      }

      const cur = this.save.mapNodes.find((n: MapNodeDTO) => n.id === this.save!.currentNodeId);
      if (cur && !cur.neighbors.includes(targetId)) {
        const t = this.add.text(this.scale.width/2, 40, 'Noeud non accessible', { color: '#fff' }).setOrigin(0.5);
        this.time.delayedCall(1200, () => t.destroy());
        return;
      }

      try {
        this.save = await this.saveSvc.move(this.save._id, {
          targetNodeId: targetId,
          clientTick: this.save.clientTick,
        });

        this.applySaveToNodes(this.save);

        const freshNode = this.save.mapNodes.find((n: MapNodeDTO) => n.id === targetId)!;

        // si le back dit qu'un combat est actif → on reprend direct
        if (this.isCombatActive(this.save)) {
          this.game.registry.set('saveId', this.save._id);
          this.scene.launch('MainScene', { resumeFromSave: true, saveId: this.save._id });
          this.scene.sleep();
          return;
        }

        if (['fight', 'elite', 'boss'].includes(freshNode.type)) {
          try {
            this.save = await this.saveSvc.combatStart(this.save._id, {
              encounterId: `enc_${Date.now()}`,
              rngSeed: Math.floor(Math.random() * 1e9),
              monsters: [{ monsterId: 'arnak', hp: 250, maxHp: 250, block: 0, buffs: [] }]
            } as any);

            this.game.registry.set('saveId', this.save._id);
            this.scene.launch('MainScene', { resumeFromSave: true, saveId: this.save._id });
            this.scene.sleep();
          } catch (err: any) {
            const msg = err?.error?.message || err?.message || '';
            if (err?.status === 400 && String(msg).toLowerCase().includes('combat already active')) {
              this.game.registry.set('saveId', this.save._id);
              this.scene.launch('MainScene', { resumeFromSave: true, saveId: this.save!._id });
              this.scene.sleep();
            } else {
              throw err;
            }
          }
        }
      } catch (e: any) {
        console.warn('[MapScene] move/combat error:', e?.error || e);
        const t = this.add.text(this.scale.width/2, 40, 'Déplacement impossible', { color: '#fff' }).setOrigin(0.5);
        this.time.delayedCall(1200, () => t.destroy());
      }
    });
  }

  // ---------- Legacy local

  private loadPersistence() {
    try {
      const raw = localStorage.getItem(this.storageClearedKey);
      if (raw) JSON.parse(raw).forEach((i: number) => this.clearedSet.add(i));
    } catch {}
    try {
      const raw = localStorage.getItem(this.storageChoiceKey);
      if (raw) this.choices = JSON.parse(raw);
    } catch {}
  }

  private saveCleared() {
    try { localStorage.setItem(this.storageClearedKey, JSON.stringify([...this.clearedSet])); } catch {}
  }

  private saveChoices() {
    try { localStorage.setItem(this.storageChoiceKey, JSON.stringify(this.choices)); } catch {}
  }

  private buildParents() {
    this.PARENTS = {};
    for (const [from, children] of Object.entries(this.EDGES)) {
      const f = Number(from);
      children.forEach(ch => {
        if (!this.PARENTS[ch]) this.PARENTS[ch] = [];
        this.PARENTS[ch].push(f);
      });
    }
  }

  private findLayerOf(index: number): number {
    for (let l = 0; l < this.LAYERS.length; l++) {
      if (this.LAYERS[l].includes(index)) return l;
    }
    return -1;
  }
}
