import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AuthService } from "../../page/authentification-page/services/auth-service";
import { Router } from '@angular/router';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profil.html',
  styleUrl: './profil.css'
})
export class Profil implements OnInit {

  pseudo: string | null = null;
  email: string | null = null;
  gamesPlayed: number | null = null;

  @Input() visible: boolean = false;
  @Output() closed: EventEmitter<void> = new EventEmitter<void>();
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.getMe().subscribe({
      next: (res) => {
        this.pseudo = res.pseudo;
        this.email = res.email;
        this.gamesPlayed = res.gamesPlayed ?? 0;

        localStorage.setItem('pseudo', res.pseudo);
        localStorage.setItem('email', res.email);
        localStorage.setItem('gamesPlayed', (res.gamesPlayed ?? 0).toString());
      },
      error: (err) => {
        console.error('❌ Erreur chargement profil :', err);
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  close(): void {
    this.closed.emit();
  }
}
