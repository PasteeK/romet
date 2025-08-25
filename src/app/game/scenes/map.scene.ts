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

    const once = sessionStorage.getItem(this.storageForceOnce) === '1';
    this.forceNew = !!data?.forceNew || once;

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
    this.load.image('smoking', 'assets/images/events/smokingEvent.png');
    this.load.image('elite', 'assets/images/events/eliteEvent.png');

  }

  private async waitFontsSafely(timeoutMs = 1200): Promise<void> {
    try {
      const fonts: any = (document as any).fonts;
      if (fonts?.ready) {
        await Promise.race([fonts.ready, new Promise<void>(r => setTimeout(r, timeoutMs))]);
      }
    } catch {  }
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
        // 👉 Nouvelle partie explicite uniquement ici
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
        // 👉 Continuer : on essaye de reprendre, on ne crée rien
        this.save = await this.saveSvc.getCurrent();

        if (!this.save) {
          // Aucune sauvegarde → NE PAS créer de run ici
          sessionStorage.removeItem(this.storageForceOnce); // nettoyage par sécurité
          this.showNoSaveOverlay(); // Affiche un message et QUITTE
          return;
        }

        // Mémoriser l'id et nettoyer le flag s'il traînait
        try { localStorage.setItem(this.storageRunIdKey, this.save._id); } catch {}
        sessionStorage.removeItem(this.storageForceOnce);
      }

      console.log('[SAVE] currentNodeId =', this.save.currentNodeId);

      // Reprise combat direct si actif
      if (this.isCombatActive(this.save)) {
        this.game.registry.set('saveId', this.save._id);
        this.scene.launch('MainScene', { resumeFromSave: true, saveId: this.save._id });
        this.scene.sleep();
        return;
      }

      // Sinon affichage map
      this.applyAndFixAfterServer(this.save);
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

  private showNoSaveOverlay() {
    const bg = this.add.rectangle(0,0,this.scale.width,this.scale.height,0x000000,0.55)
      .setOrigin(0);
    const t = this.add.text(
      this.scale.width/2, this.scale.height/2,
      'Aucune sauvegarde à reprendre.\nRetournez au menu et cliquez « Nouvelle partie ».',
      { color: '#fff', fontSize: '22px', fontFamily: 'sans-serif', align: 'center' }
    ).setOrigin(0.5);
  }

  /**
   * Combat ACTIF = on reprend.
   */
  private isCombatActive(s: SavegameDTO | null | undefined): boolean {
    const c: any = s?.combat;
    if (!c) return false;
    if (c.ended === true) return false;
    if (c.finished === true) return false;
    if (c.finishedAt) return false;
    if (typeof c.result === 'string' && c.result.length) return false;
    const status = String(c.status ?? c.state ?? '').toLowerCase();
    if (['ended', 'finished', 'over', 'resolved', 'victory', 'defeat'].includes(status)) return false;
    return true;
  }

  // ---------- Helpers serveur

  private generateMapNodes(positions: {x:number;y:number}[]): MapNodeDTO[] {
    // Types "hors combat simple"
    const NON_SIMPLE: Array<'elite' | 'shop' | 'smoking'> = ['elite', 'shop', 'smoking'];

    // Pour mémoriser le type décidé par index, utile pour regarder les parents
    const typeByIndex: Record<number, 'fight' | 'elite' | 'shop' | 'smoking' | 'boss'> = {};

    const rollType = (): 'fight' | 'elite' | 'shop' | 'smoking' => {
      // pondération (ajuste si tu veux)
      // fight 55%, elite 15%, shop 15%, campfire 15%
      const r = Math.random();
      if (r < 0.85) return 'fight';
      // if (r < 0.70) return 'elite';
      // if (r < 0.85) return 'shop';
      return 'smoking';
    };

    const nodes: MapNodeDTO[] = positions.map((p, i) => {
      let type: 'fight' | 'elite' | 'shop' | 'smoking' | 'boss';

      if (i >= 13) {
        // Dernière ligne: boss
        type = 'elite';
      } else if (i <= 2) {
        // Premier choix: combat simple
        type = 'fight';
      } else {
        // Si un parent est "hors combat simple" → on force un 'fight'
        const parents = this.PARENTS[i] || [];
        const parentHasNonSimple = parents.some(pi => NON_SIMPLE.includes(typeByIndex[pi] as any));

        type = parentHasNonSimple ? 'fight' : rollType();
      }

      typeByIndex[i] = type;

      return {
        id: `n${i}`,
        x: p.x, y: p.y,
        type,
        neighbors: (this.EDGES[i] || []).map(j => `n${j}`),
        state: i <= 2 ? 'available' : 'locked',
      };
    });

    // Noeud de départ
    nodes.push({
      id: 'start',
      x: 0, y: 0,
      type: 'start',
      neighbors: ['n0', 'n1', 'n2'],
      state: 'cleared',
    });

    return nodes;
  }

  private getTextureForType(type: string): string {
    switch (type) {
      case 'fight': return 'simple_fight';
      case 'shop': return 'shop';
      case 'smoking': return 'smoking';
      case 'elite': return 'elite';
      case 'boss': return 'boss';
      default: return 'simple_fight';
    }
  }


  private applySaveToNodes(save: SavegameDTO) {
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      if (!node) continue;

      const id = `n${i}`;
      const dto = save.mapNodes.find((n: MapNodeDTO) => n.id === id);
      if (!dto) { 
        node.setBlocked(); 
        continue; 
      }

      node.setType(dto.type);

      // 🔥 ici on change la texture selon le type
      const tex = this.getTextureForType(dto.type);
      node.setTexture(tex);

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
        if (this.save?._id) {
          this.game.registry.set('saveId', this.save._id);
        }
        this.scene.launch('MainScene', { resumeFromSave: true, saveId: this.save!._id });
        this.scene.sleep();
        return;
      }
      if (this.save) {
        this.applyAndFixAfterServer(this.save);
      }
    } catch (e) {
      console.warn('[MapScene] refreshFromServer error:', e);
    }
  };

  private applySaveStatsToUI(save: SavegameDTO) {
    // HP
    const hp =
      (save as any).playerHp ??
      (save as any).currentHp ??
      (save as any).player?.hp ??
      (save as any).startingHp ??
      100;
    this.gameUI.setHP(hp);

    // Max HP si dispo
    if (typeof (this.gameUI as any).setMaxHP === 'function') {
      const max =
        (save as any).maxHp ??
        (save as any).player?.maxHp ??
        100;
      (this.gameUI as any).setMaxHP(max);
    }

    // 💰 GOLD — ajouté
    const gold =
      (save as any).playerGold ??
      (save as any).gold ??
      (save as any).player?.gold ??
      0;
    this.gameUI.setGold(gold);
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

        // 🚬 ———— CAS "SMOKING" ————
        if (freshNode.type === 'smoking') {
          this.game.registry.set('saveId', this.save._id);
          this.scene.launch('SmokingScene', { saveId: this.save._id });
          this.scene.sleep();
          return;
        }

        // ⚔️ ———— CAS COMBAT ————
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

  private postCombatUnlock(save: SavegameDTO) {
    const cur = save.mapNodes.find(n => n.id === save.currentNodeId);
    if (!cur) return;

    if (cur.state !== 'cleared') cur.state = 'cleared';

    for (const nid of cur.neighbors) {
      const neighbor = save.mapNodes.find(n => n.id === nid);
      if (!neighbor) continue;
      if (neighbor.state !== 'cleared') neighbor.state = 'available';
    }
  }

  private applyAndFixAfterServer(save: SavegameDTO) {
    if (!this.isCombatActive(save)) {
      this.postCombatUnlock(save);
    }
    this.applySaveToNodes(save);
    this.applySaveStatsToUI(save);
  }

  private findLayerOf(index: number): number {
    for (let l = 0; l < this.LAYERS.length; l++) {
      if (this.LAYERS[l].includes(index)) return l;
    }
    return -1;
  }
}
