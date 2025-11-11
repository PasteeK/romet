import { GameUI } from "./GameUI";

export class Player {
  private hp = 100;
  private gold = 0;

  constructor(private ui: GameUI, initialHp?: number) {
    if (typeof initialHp === 'number') this.hp = Math.max(0, initialHp);
    this.ui.setHP(this.hp);
    this.ui.setGold?.(this.gold);
  }

  // Met à jour les points de vie du joueur
  public setHP(value: number) {
    this.hp = Math.max(0, Math.floor(value));
    this.ui.setHP(this.hp);
  }

  // Faire des dégats au joueur
  public takeDamage(amount: number) {
    const a = Math.max(0, Math.floor(amount));
    this.hp = Math.max(0, this.hp - a);
    this.ui.setHP(this.hp);
  }

  // Soigner le joueur
  public heal(amount: number) {
    const a = Math.max(0, Math.floor(amount));
    this.hp += a;
    this.ui.setHP(this.hp);
  }

  // Récupérer les points de vie
  public getHP() { return this.hp; }

  // Met à jour l'or du joueur
  public setGold(amount: number) {
    this.gold = Math.max(0, Math.floor(amount));
    this.ui?.setGold(this.gold);
  }

  // Ajouter de l'or
  public addGold(amount: number) {
    const a = Math.floor(amount);
    if (!Number.isFinite(a)) return;
    this.gold = Math.max(0, this.gold + a);
    this.ui?.setGold(this.gold);
  }

  // Voler de l'or au joueur
  public stealGoldPercent(percent: number) {
    const p = Math.max(0, Math.min(100, percent));
    const amountToSteal = Math.floor(this.gold * (p / 100));
    this.gold = Math.max(0, this.gold - amountToSteal);
    this.ui?.setGold(this.gold);
    return amountToSteal;
  }

  // Récupérer l'or du joueur
  public getGold() { return this.gold; }
}
