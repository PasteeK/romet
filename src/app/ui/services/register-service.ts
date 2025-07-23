import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Register } from '../register/register';

export interface RegisterCredentials {
  email: string;
  password: string;
  username: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class RegisterService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/players';

  register(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/add`, data);
  }
}