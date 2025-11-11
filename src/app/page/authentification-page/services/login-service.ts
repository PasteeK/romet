import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment.development';

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
  private apiUrl = environment.API_BASE_URL + '/players';

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
