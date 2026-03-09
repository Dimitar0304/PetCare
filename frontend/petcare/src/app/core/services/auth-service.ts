import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private url = '';
  constructor(private http: HttpClient) {}

  login(username: string, password: string) {

    return this.http.post('/api/login', { username, password });
  }

    saveToken(token: string) {
    localStorage.setItem('token', token);
  }
}
