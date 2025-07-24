import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RegisterService } from '../services/register-service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  private registerService = inject(RegisterService);
  private router = inject(Router);

  username = '';
  email = '';
  password = '';
  confirmPassword = '';
  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  register() {
    if (!this.email || !this.password || !this.username || this.password !== this.confirmPassword) {
      this.errorMessage.set('Veuillez remplir tous les champs correctement.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.registerService.register({
      username: this.username,
      email: this.email,
      password: this.password
    }).subscribe({
      next: () => {
        this.successMessage.set("Inscription réussie !");
        this.errorMessage.set('');
        this.loading.set(false);
        setTimeout(() => {
          this.router.navigate(['/titlescreen']);
        }, 1000);
      },
      error: (err) => {
        if (err.status === 409) {
          this.errorMessage.set("Ce nom d'utilisateur est déjà utilisé.");
        } else {
          this.errorMessage.set("Une erreur est survenue. Veuillez réessayer.");
        }
        this.successMessage.set('');
        this.loading.set(false);
      }
    });
  }
}
