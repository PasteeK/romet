import { GameUI } from "./GameUI";

export class Player {
  private hp = 100;
  private gold = 0;

  constructor(private ui: GameUI, initialHp?: number) {
    if (typeof initialHp === 'number') this.hp = Math.max(0, initialHp);
    this.ui.setHP(this.hp);
    this.ui.setGold?.(this.gold);
  }

  public setHP(value: number) {
    this.hp = Math.max(0, Math.floor(value));
    this.ui.setHP(this.hp);
  }

  public takeDamage(amount: number) {
    const a = Math.max(0, Math.floor(amount));
    this.hp = Math.max(0, this.hp - a);
    this.ui.setHP(this.hp);
  }

  public heal(amount: number) {
    const a = Math.max(0, Math.floor(amount));
    this.hp += a;
    this.ui.setHP(this.hp);
  }

  public getHP() { return this.hp; }

  public setGold(amount: number) {
    this.gold = Math.max(0, Math.floor(amount));
    this.ui?.setGold(this.gold);
  }

  public addGold(amount: number) {
    const a = Math.floor(amount);
    if (!Number.isFinite(a)) return;
    this.gold = Math.max(0, this.gold + a);
    this.ui?.setGold(this.gold);
  }

  public stealGoldPercent(percent: number) {
    const p = Math.max(0, Math.min(100, percent));
    const amountToSteal = Math.floor(this.gold * (p / 100)); // ✅ typo fix
    this.gold = Math.max(0, this.gold - amountToSteal);
    this.ui?.setGold(this.gold);
    return amountToSteal;
  }

  public getGold() { return this.gold; }
}
