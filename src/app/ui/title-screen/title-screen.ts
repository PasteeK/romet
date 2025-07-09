import { Component, HostListener } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Logo } from "../../shared/logo/logo";

@Component({
  selector: 'app-title-screen',
  templateUrl: './title-screen.html',
  styleUrls: ['./title-screen.css'],
  imports: [Logo, RouterLink]
})
export class TitleScreenComponent {
  constructor(private router: Router) {}

  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    this.startGame();
  }

  startGame() {
    this.router.navigate(['/map']);
  }
}
