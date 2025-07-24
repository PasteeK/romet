import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LoginService } from '../services/login-service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private loginService = inject(LoginService);
  private router = inject(Router);

  username = '';
  password = '';
  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  login() {
    if (!this.username || !this.password) {
      this.errorMessage.set('Veuillez remplir tous les champs correctement.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.loginService.login(this.username, this.password).subscribe({
      next: () => {
        this.successMessage.set("Connexion réussie !");
        this.errorMessage.set('');
        this.loading.set(false);
        setTimeout(() => {
          this.router.navigate(['/titlescreen']);
        }, 1000);
      },
      error: (err) => {
        if (err.status === 401) {
          this.errorMessage.set("Nom d'utilisateur ou mot de passe incorrect.");
        } else {
          this.errorMessage.set("Une erreur est survenue. Veuillez réessayer.");
        }
        this.successMessage.set('');
        this.loading.set(false);
      }
    });
  }
}
