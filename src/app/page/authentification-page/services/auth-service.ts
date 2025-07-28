import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, signal } from '@angular/core';
import { map, Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) { }

  isLoggedIn = signal(this.hasValidToken());

  
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  setPseudo(pseudo: string) {
    localStorage.setItem('username', pseudo);
  }

  getMe(): Observable<{ pseudo: string; email: string; gamesPlayed: number }> {
    return this.http.get<{ pseudo: string; email: string; gamesPlayed: number }>(
      'http://localhost:3000/players/me',
      {
        headers: { Authorization: `Bearer ${this.getToken()}` }
      }
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.clear();
    this.isLoggedIn.set(false);
  }

  clear(): void {
    localStorage.clear();
    this.isLoggedIn.set(false);
  }

  deleteAccount(): Observable<void> {
    return this.http.delete<void>('http://localhost:3000/players/me', {
      headers: { Authorization: `Bearer ${this.getToken()}` }
    });
  }


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
