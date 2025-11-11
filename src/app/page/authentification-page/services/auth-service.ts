import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, signal } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment.development';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private http: HttpClient) { }
  isLoggedIn = signal(this.hasValidToken());
  
  // Récupérer le token
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Récupère le pseudo
  setPseudo(pseudo: string) {
    localStorage.setItem('username', pseudo);
  }

  // Récupère les infos du joueur
  getMe(): Observable<{ pseudo: string; email: string; gamesPlayed: number }> {
    return this.http.get<{ pseudo: string; email: string; gamesPlayed: number }>(
      environment.API_BASE_URL + '/me',
      {
        headers: { Authorization: `Bearer ${this.getToken()}` }
      }
    );
  }

  // Deconnexion
  logout() {
    localStorage.removeItem('token');
    localStorage.clear();
    this.isLoggedIn.set(false);
  }

  // Clear localstorage
  clear(): void {
    localStorage.clear();
    this.isLoggedIn.set(false);
  }

  // Suppression du compte
  deleteAccount(): Observable<void> {
    return this.http.delete<void>(environment.API_BASE_URL + '/players/me', {
      headers: { Authorization: `Bearer ${this.getToken()}` }
    });
  }


  // Check si le token est valide
  private hasValidToken(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }
}
