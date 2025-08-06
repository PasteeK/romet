import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/players';

  login(username: string, password: string): Observable<LoginResponse> {
    const credentials: LoginCredentials = { username, password };
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap((response: LoginResponse) => {
          // console.log(response);

          localStorage.setItem('token', response.token);
          localStorage.setItem('username', username);
        })
      );
  }
}
