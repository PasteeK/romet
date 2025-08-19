import { GameUI } from "./GameUI";

export class Player {
  private hp: number = 100;
  private gold: number = 0;
  private gameUI?: GameUI;

  constructor(private ui: GameUI, initialHp?: number) {
    if (typeof initialHp === 'number') {
        this.hp = Math.max(0, initialHp);
        this.ui.setHP(this.hp);
    }
  }

  public setHP(value: number) {
    this.hp = Math.max(0, value);
    this.ui.setHP(this.hp);
  }

  public takeDamage(amount: number) {
    this.hp = Math.max(0, this.hp - amount);
    this.ui.setHP(this.hp);
  }

  public heal(amount: number) {
    this.hp += amount;
    this.ui.setHP(this.hp);
  }

  public getHP() {
    return this.hp;
  }

  public setGold(amount: number) {
    this.gold = amount;
    if (this.gameUI) {
      this.gameUI.setGold(this.gold);
    }
  }

  public addGold(amount: number) {
    this.gold += amount;
    if (this.gameUI) {
      this.gameUI.setGold(this.gold);
    }
  }

  public stealGoldPercent(percent: number) {
    const amontToSteal = Math.floor(this.gold * (percent / 100));
    this.gold -= amontToSteal;
    if (this.gameUI) {
      this.gameUI.setGold(this.gold);
    }
    return amontToSteal;
  }

  public getGold() {
    return this.gold;
  }
}
