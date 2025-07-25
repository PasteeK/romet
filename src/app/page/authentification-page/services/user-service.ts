import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

interface PlayerProfile {
  pseudo: string;
  email: string;
  gamesPlayed: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:3000/players/me';

  constructor(private http: HttpClient) {}

  getProfile(): Observable<PlayerProfile> {
    const token = localStorage.getItem('token');
    console.log('[UserService] Token utilisé :', token);
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get<PlayerProfile>(this.apiUrl, { headers });
  }

  incrementGamesPlayed(): Observable<{ gamesPlayed: number }> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.patch<{ gamesPlayed: number }>(
      'http://localhost:3000/players/increment-games',
      {},
      { headers }
    );
  }
}
