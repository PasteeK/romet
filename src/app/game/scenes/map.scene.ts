import Phaser from "phaser";
import { MapNode } from "../classes/MapNode";
import { GameUI } from "../classes/GameUI";

export class MapScene extends Phaser.Scene {
  private gameUI!: GameUI;
  private nodes: MapNode[] = [];

  // Persistance
  private storageClearedKey = 'romet.clearedNodes.v1';
  private storageChoiceKey  = 'romet.pathChoices.v1';
  private clearedSet = new Set<number>();
  private choices: Record<number, number> = {}; // layer -> nodeIndex choisi

  // Couches et connexions
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

  constructor() {
    super('MapScene');
  }

  // ---------- Lifecycle

  init(data?: { clearedNodes?: number[] }) {
    // 1) Construire la map des parents
    this.buildParents();

    // 2) Charger persistance (cleared + choix de chemin)
    this.loadPersistence();

    // 3) Merger d’éventuels cleared passés via params (au cas où)
    const fromParam = data?.clearedNodes ?? [];
    fromParam.forEach(i => this.clearedSet.add(i));
    this.saveCleared(); // on écrit si on a enrichi
  }

  preload() {
    this.load.image('map_bg', 'assets/images/map/map_bg.png');
    this.load.image('map', 'assets/images/map/map.png');
    this.load.image('ui_bg', 'assets/images/ui_bg.png');
    this.load.image('simple_fight', 'assets/images/events/simple_fight.png');
  }

  create() {
    document.fonts.ready.then(() => {
      this.add.image(this.scale.width / 2, this.scale.height / 2, 'map_bg')
        .setDisplaySize(this.scale.width, this.scale.height);

      this.add.image(0, 0, 'ui_bg').setOrigin(0.5).setScale(1.25, 1.5);

      // UI
      this.gameUI = new GameUI(this);
      this.gameUI.setHP(100);
      this.gameUI.setGold(0);
      this.gameUI.setDiscard(0);
      this.gameUI.setScore('', 0);

      // Map
      const map = this.add.image(this.scale.width / 1.625, this.scale.height / 2, 'map');
      const scale = Math.min(this.scale.width / map.width, this.scale.height / map.height);
      map.setScale(scale);

      // Nodes
      const nodePositions = [
        { x: 583, y: 548 },   { x: 787.5, y: 548 }, { x: 992, y: 548 },
        { x: 445, y: 410 },   { x: 583, y: 410 },   { x: 718.5, y: 410 },
        { x: 855, y: 410 },   { x: 995, y: 410 },   { x: 1131, y: 410 },
        { x: 445, y: 272.5 }, { x: 650.75, y: 272.5 }, { x: 925, y: 272.5 }, { x: 1131, y: 272.5 },
        { x: 445, y: 135 },   { x: 650.75, y: 135 },   { x: 925, y: 135 },   { x: 1131, y: 135 },
      ];

      nodePositions.forEach((pos, i) => {
        const node = new MapNode(this, pos.x, pos.y, i, 'simple_fight');
        this.nodes[i] = node;
      });

      // Appliquer l’état initial (cleared/available/blocked)
      this.updateReachability();

      // Écoute des événements
      const onCleared  = (idx: number) => this.markNodeCleared(idx);
      const onSelected = (idx: number) => this.onNodeSelected(idx);

      this.game.events.on('node:cleared', onCleared);
      this.game.events.on('map:nodeSelected', onSelected);

      // Cleanup
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.game.events.off('node:cleared', onCleared);
        this.game.events.off('map:nodeSelected', onSelected);
      });
    });
  }

  // ---------- Persistance

  private loadPersistence() {
    // cleared
    try {
      const raw = localStorage.getItem(this.storageClearedKey);
      if (raw) JSON.parse(raw).forEach((i: number) => this.clearedSet.add(i));
    } catch {/* ignore */ }

    // choices
    try {
      const raw = localStorage.getItem(this.storageChoiceKey);
      if (raw) this.choices = JSON.parse(raw);
    } catch {/* ignore */ }
  }

  private saveCleared() {
    try {
      localStorage.setItem(this.storageClearedKey, JSON.stringify([...this.clearedSet]));
    } catch {/* ignore */ }
  }

  private saveChoices() {
    try {
      localStorage.setItem(this.storageChoiceKey, JSON.stringify(this.choices));
    } catch {/* ignore */ }
  }

  // ---------- Mise à jour d’état

  public markNodeCleared(index: number) {
    if (!this.clearedSet.has(index)) {
      this.clearedSet.add(index);
      this.saveCleared();
    }
    const node = this.nodes[index];
    if (node) node.setCleared();

    this.updateReachability();
  }

  private onNodeSelected = (index: number) => {
    const layer = this.findLayerOf(index);
    if (layer < 0) return;

    // Si un choix existe déjà et diffère, on ne le remplace pas (chemin figé)
    if (this.choices[layer] !== undefined && this.choices[layer] !== index) return;

    this.choices[layer] = index;
    this.saveChoices();

    this.updateReachability();
  };

  private updateReachability() {
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      if (!node) continue;

      if (this.clearedSet.has(i)) {
        node.setCleared();
        continue;
      }

      const layer = this.findLayerOf(i);
      let available = false;

      if (layer === 0) {
        const choice0 = this.choices[0];
        available = (choice0 === undefined) || (choice0 === i);
      } else {
        const parents = this.PARENTS[i] || [];
        const prevChoice = this.choices[layer - 1];

        if (prevChoice !== undefined) {
          available = parents.includes(prevChoice);
        } else {
          // pas encore de choix au layer précédent => atteignable si un parent est déjà cleared
          available = parents.some(p => this.clearedSet.has(p));
        }
      }

      if (available) node.setAvailable();
      else node.setBlocked();
    }
  }

  // ---------- Utils

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
