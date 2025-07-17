import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface Node {
  id: string;
  x: number;
  y: number;
  type: 'start' | 'fight' | 'elite' | 'shop' | 'smoking' | 'cheater' | 'boss';
  neighbors: string[];
  visited: boolean;
  active: boolean;
  blocked: boolean;
  isPreview?: boolean;
}

@Component({
  selector: 'app-map',
  templateUrl: './map.html',
  imports: [CommonModule],
  styleUrls: ['./map.css']
})
export class MapComponent {
  public EVENT_POOL = [
    'fight',
    'shop',
    'smoking',
    'cheater'
  ]

  public EVENT_POOL_START = [
    'fight',
  ]

  randomizeEventPool(): 'start' | 'fight' | 'elite' | 'shop' | 'smoking' | 'cheater' | 'boss' {
    this.EVENT_POOL = this.EVENT_POOL.sort(() => Math.random() - 0.5);
    return this.EVENT_POOL[0] as 'start' | 'fight' | 'elite' | 'shop' | 'smoking' | 'cheater' | 'boss';
  }
  
  nodes: Node[] = [
    // X offset : 1.38 | Y offset : 1.85
    { id: 'start', x: 6.13, y: 9.2, type: 'start', neighbors: ['0a', '0b', '0c'], visited: true, active: true, blocked: false },

    { id: '0a', x: 4.75, y: 7.35, type: 'fight', neighbors: ['1a', '1b'], visited: false, active: false, blocked: false },
    { id: '0b', x: 6.13, y: 7.35, type: 'fight', neighbors: ['1c', '1d'], visited: false, active: false, blocked: false },
    { id: '0c', x: 7.51, y: 7.35, type: 'fight', neighbors: ['1e', '1f'], visited: false, active: false, blocked: false },

    { id: '1a', x: 3.82, y: 5.45, type: this.randomizeEventPool(), neighbors: ['2a'], visited: false, active: false, blocked: false },
    { id: '1b', x: 4.75, y: 5.45, type: this.randomizeEventPool(), neighbors: ['2b'], visited: false, active: false, blocked: false },
    { id: '1c', x: 5.7, y: 5.45, type: this.randomizeEventPool(), neighbors: ['2b'], visited: false, active: false, blocked: false },
    { id: '1d', x: 6.6, y: 5.45, type: this.randomizeEventPool(), neighbors: ['2c'], visited: false, active: false, blocked: false },
    { id: '1e', x: 7.53, y: 5.45, type: this.randomizeEventPool(), neighbors: ['2c'], visited: false, active: false, blocked: false },
    { id: '1f', x: 8.43, y: 5.45, type: this.randomizeEventPool(), neighbors: ['2d'], visited: false, active: false, blocked: false },

    { id: '2a', x: 3.82, y: 3.55, type: this.randomizeEventPool(), neighbors: ['3a'], visited: false, active: false, blocked: false },
    { id: '2b', x: 5.22, y: 3.55, type: this.randomizeEventPool(), neighbors: ['3b'], visited: false, active: false, blocked: false },
    { id: '2c', x: 7.05, y: 3.55, type: this.randomizeEventPool(), neighbors: ['3c'], visited: false, active: false, blocked: false },
    { id: '2d', x: 8.43, y: 3.55, type: this.randomizeEventPool(), neighbors: ['3d'], visited: false, active: false, blocked: false },

    { id: '3a', x: 3.82, y: 1.65, type: 'elite', neighbors: ['boss'], visited: false, active: false, blocked: false },
    { id: '3b', x: 5.22, y: 1.65, type: 'elite', neighbors: ['boss'], visited: false, active: false, blocked: false },
    { id: '3c', x: 7.05, y: 1.65, type: 'elite', neighbors: ['boss'], visited: false, active: false, blocked: false },
    { id: '3d', x: 8.43, y: 1.65, type: 'elite', neighbors: ['boss'], visited: false, active: false, blocked: false },

    { id: 'boss', x: 6.13, y: 0.68, type: 'boss', neighbors: [], visited: false, active: false, blocked: false },
  ];

  currentNode: Node = this.nodes[0];

  onNodeClick(node: Node): void {
    if (!node.active || node.blocked) return;

    node.visited = true;
    this.currentNode = node;

    this.nodes.forEach(n => {
      n.active = false;
      n.blocked = !node.neighbors.includes(n.id);
    });

    node.neighbors.forEach(id => {
      const neighbor = this.nodes.find(n => n.id === id);
      if (neighbor && !neighbor.visited) {
        neighbor.active = true;
        neighbor.blocked = false;
      }
    });
  }

  onHoverStart(target: Node): void {
    const path = this.findPath(this.currentNode.id, target.id);
    if (!path) return;

    path.forEach((id, index) => {
      const node = this.nodes.find(n => n.id === id);
      if (node) {
        setTimeout(() => node.isPreview = true, index * 150);
      }
    });
  }

  onHoverEnd(): void {
    this.nodes.forEach(n => n.isPreview = false);
  }

  findPath(startId: string, endId: string): string[] | null {
    const queue: { id: string; path: string[] }[] = [{ id: startId, path: [startId] }];
    const visited = new Set<string>();

    while (queue.length) {
      const { id, path } = queue.shift()!;
      if (id === endId) return path;

      visited.add(id);
      const node = this.nodes.find(n => n.id === id);
      if (!node) continue;

      for (const neighbor of node.neighbors) {
        if (!visited.has(neighbor)) {
          queue.push({ id: neighbor, path: [...path, neighbor] });
        }
      }
    }

    return null;
  }
}
