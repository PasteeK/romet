import Phaser from 'phaser';
import { SoundRef, SoundSet, MonsterSounds } from '../classes/monsters/types';

// Retourne un son aleatoirement choisi
export function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Jouer un son
export function playSound(scene: Phaser.Scene, set?: SoundSet) {
  if (!set) return;
  const ref: SoundRef = Array.isArray(set) ? pickOne(set) : set;
  if (!ref) return;

  if (typeof ref === 'string') {
    scene.sound.play(ref);
  } else {
    const { key, volume, rate, detune } = ref;
    scene.sound.play(key, { volume, rate, detune });
  }
}

// Récupérer les clés des sons
export function extractSoundKeys(sounds?: MonsterSounds): string[] {
  const out: string[] = [];
  const pushRef = (r?: SoundRef | SoundRef[]) => {
    if (!r) return;
    if (Array.isArray(r)) { r.forEach(pushRef); return; }
    if (typeof r === 'string') out.push(r);
    else out.push(r.key);
  };

  if (!sounds) return out;
  pushRef(sounds.spawn);
  pushRef(sounds.hit);
  pushRef(sounds.death);

  if (sounds.action) {
    if (Array.isArray(sounds.action) || typeof sounds.action === 'string') {
      pushRef(sounds.action as SoundSet);
    } else {
      Object.values(sounds.action).forEach(pushRef);
    }
  }
  return out;
}
