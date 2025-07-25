import { Component, Inject } from '@angular/core';
import { UserService } from '../page/authentification-page/services/user-service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-game',
  imports: [],
  templateUrl: './game.html',
  styleUrl: './game.css'
})
export class Game {

  constructor(private userService: UserService) {}

  gamesPlayed: number = 0;

  simulateGame() {
    this.userService.incrementGamesPlayed().subscribe({
      next: (res: { gamesPlayed: number }) => {
        this.gamesPlayed = res.gamesPlayed;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Erreur lors de l’incrément de gamesPlayed :', err);
      }
    });
  }
}