import Phaser from "phaser";

export type EncounterType = 'normal' | 'elite' | 'boss';

type Pools = { normal: string[]; elite: string[] };
const REG_KEY = 'defeatedPools';

function readPools(scene: Phaser.Scene): Pools {
  const raw = scene.game.registry.get(REG_KEY);
  if (raw && typeof raw === 'object') {
    const n = Array.isArray(raw.normal) ? raw.normal : [];
    const e = Array.isArray(raw.elite)  ? raw.elite  : [];
    return { normal: n, elite: e };
  }
  const init: Pools = { normal: [], elite: [] };
  scene.game.registry.set(REG_KEY, init);
  return init;
}

function writePools(scene: Phaser.Scene, pools: Pools) {
  scene.game.registry.set(REG_KEY, { normal: [...pools.normal], elite: [...pools.elite] });
}

export function filterPoolByDefeated<T extends { name: string }>(
  scene: Phaser.Scene,
  type: EncounterType,
  pool: T[],
): T[] {
  if (type === 'boss') return pool; // le boss n'est pas filtré ici
  const p = readPools(scene);
  const banned = new Set(type === 'elite' ? p.elite : p.normal);
  const filtered = pool.filter(m => !banned.has(m.name));
  return filtered.length > 0 ? filtered : pool; // si tout est filtré, on retombe sur le pool complet
}

export function markMonsterDefeated(scene: Phaser.Scene, type: EncounterType, name: string) {
  if (type === 'boss') return; // on gère le reset ailleurs
  const p = readPools(scene);
  const arr = type === 'elite' ? p.elite : p.normal;
  if (!arr.includes(name)) arr.push(name);
  writePools(scene, p);
}

export function clearDefeatedPools(scene: Phaser.Scene) {
  writePools(scene, { normal: [], elite: [] });
}

// (optionnel) lecture pour persistance si tu veux la sauvegarder
export function getDefeatedPools(scene: Phaser.Scene): Pools {
  return readPools(scene);
}