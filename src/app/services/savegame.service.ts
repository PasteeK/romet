import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { first, firstValueFrom } from 'rxjs';

export type EventType = 'start' | 'fight' | 'elite' | 'shop' | 'smoking' | 'cheater' | 'boss';

export interface MapNodeDTO {
  id: string;
  x: number;
  y: number;
  type: 'start' | 'fight' | 'elite' | 'boss' | string;
  neighbors: string[];
  state: 'locked' | 'available' | 'cleared';
}

export interface CardInstanceDTO {
  iid: string;
  cardId: string;
  upgrades?: number;
  modifiers?: string[];
}

export interface MonsterStateDTO {
  monsterId: string;
  hp: number;
  maxHp: number;
  block?: number;
  intents?: string;
  buffs?: { name: string; stacks: number }[];
}

export interface PileDTO {
  cards: CardInstanceDTO[]
}

export interface CombatStateDTO {
  encounterId: string;
  rngSeed: number;
  turn: number;
  playerBlock: number;
  playerEffects: { name: string; stacks: number }[];
  monsters: MonsterStateDTO[];
  draw: PileDTO; hand: PileDTO; discard: PileDTO; exhaust: PileDTO;
}

export interface SavegameDTO {
  _id: string;
  seed: number;
  difficulty: 'normal' | 'hard' | string;
  mapNodes: MapNodeDTO[];
  startNodeId: string;
  currentNodeId: string;

  startingHp?: number;
  maxHp?: number;
  playerHp?: number;   // ← on normalise ici
  currentHp?: number;  // legacy

  combat?: {
    ended?: boolean;
    finished?: boolean;
    finishedAt?: string;
    result?: 'won' | 'lost' | 'escape' | string;
    status?: string; // 'active' | 'finished' ...
    state?: string;  // legacy
  };

  clientTick?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SavegameService {
  private API = 'http://localhost:3000/savegames';

  constructor(private http: HttpClient) {}

  getCurrent(): Promise<SavegameDTO | null> {
    return firstValueFrom(this.http.get<SavegameDTO | null>(`${this.API}/current`));
  }

  start(params: {
    seed: number;
    difficulty: 'easy' | 'normal' | 'hard';
    mapNodes: MapNodeDTO[];
    startNodeId: string;
    startingHp?: number;
    maxHp?: number;
  }): Promise<SavegameDTO> {
    return firstValueFrom(this.http.post<SavegameDTO>(`${this.API}/start`, params));
  }

  move(
    runId: string,
    body: { targetNodeId: string; clientTick?: number } // ← optionnel
  ): Promise<SavegameDTO> {
    return firstValueFrom(
      this.http.patch<SavegameDTO>(`${this.API}/${runId}/move`, body)
    );
  }

  combatStart(runId: string, body: {
    encounterId: string;
    rngSeed: number;
    monsters: MonsterStateDTO[];
    draw?: CardInstanceDTO[];
    hand?: CardInstanceDTO[];
    discard?: CardInstanceDTO[];
    exhaust?: CardInstanceDTO[];
  }): Promise<SavegameDTO> {
    return firstValueFrom(this.http.post<SavegameDTO>(`${this.API}/${runId}/combat/start`, body));
  }

  combatEnd(
    runId: string,
    body: {
      result: 'won' | 'lost';
      playerHp: number;
      goldDelta?: number;
      addCards?: CardInstanceDTO[];
      removeCardsIids?: string[];
    }
  ): Promise<SavegameDTO> {
    return firstValueFrom(
      this.http.post<SavegameDTO>(`${this.API}/${runId}/combat/end`, body)
    );
  }

  patch(runId: string, body: Partial<SavegameDTO> & { playerHp?: number; gold?: number }): Promise<SavegameDTO> {
    return firstValueFrom(this.http.patch<SavegameDTO>(`${this.API}/${runId}`, body));
  }
}
