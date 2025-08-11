import Phaser from "phaser";
import { MapNode } from "../classes/MapNode";
import { GameUI } from "../classes/GameUI";

export class MapScene extends Phaser.Scene {
  private gameUI!: GameUI;
  private nodes: MapNode[] = [];

  private storageKey = 'romet.clearedNodes.v1';
  private clearedSet = new Set<number>();

  constructor() {
    super('MapScene');
  }

  init(data?: { clearedNodes?: number[] }) {
    const fromParam = data?.clearedNodes ?? [];

    let fromStorage: number[] = [];
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) fromStorage = JSON.parse(raw);
    } catch (e) {
      console.warn('[MapScene] localStorage indisponible ou JSON invalide', e);
    }

    this.clearedSet = new Set<number>([...fromStorage, ...fromParam]);

    this.persistCleared();
  }

  private persistCleared() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify([...this.clearedSet]));
    } catch {}
  }

  public markNodeCleared(index: number) {
    if (this.clearedSet.has(index)) return;
    this.clearedSet.add(index);
    this.persistCleared();

    const node = this.nodes[index];
    if (node) {
      node.setCleared();
      node.disableInteractive();
    }
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

      this.gameUI = new GameUI(this);
      this.gameUI.setHP(100);
      this.gameUI.setGold(0);
      this.gameUI.setDiscard(0);
      this.gameUI.setScore('', 0);

      const map = this.add.image(this.scale.width / 1.625, this.scale.height / 2, 'map');
      const scale = Math.min(this.scale.width / map.width, this.scale.height / map.height);
      map.setScale(scale);

      const nodePositions = [
        { x: 583, y: 548 }, { x: 787.5, y: 548 }, { x: 992, y: 548 },
        { x: 445, y: 410 }, { x: 583, y: 410 }, { x: 718.5, y: 410 }, { x: 855, y: 410 }, { x: 995, y: 410 }, { x: 1131, y: 410 },
        { x: 445, y: 272.5 }, { x: 650.75, y: 272.5 }, { x: 925, y: 272.5 }, { x: 1131, y: 272.5 },
        { x: 445, y: 135 }, { x: 650.75, y: 135 }, { x: 925, y: 135 }, { x: 1131, y: 135 },
      ];

      nodePositions.forEach((pos, i) => {
        const node = new MapNode(this, pos.x, pos.y, i, 'simple_fight');
        this.nodes[i] = node;

        if (this.clearedSet.has(i)) {
          node.setCleared();
          node.disableInteractive();
        }
      });

      const onNodeCleared = (idx: number) => this.markNodeCleared(idx);
      this.game.events.on('node:cleared', onNodeCleared);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.game.events.off('node:cleared', onNodeCleared);
      });
    });
  }
}
