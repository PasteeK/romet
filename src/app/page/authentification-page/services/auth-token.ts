import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthToken {

  isLoggedIn = signal(this.hasValidToken());

  
  getToken(): string | null {
    return localStorage.getItem('token');
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
