import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment.development';

interface PlayerProfile {
  pseudo: string;
  email: string;
  gamesPlayed: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = environment.API_BASE_URL + '/players/me';

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
      environment.API_BASE_URL + '/players/increment-games',
      {},
      { headers }
    );
  }
}
