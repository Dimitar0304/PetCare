import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private url = 'https://localhost:7072/api/Auth/login'
  private tokenKey = 'auth_token';

  // Track login state
  public isLoggedIn = new BehaviorSubject<boolean>(!!this.getToken());

  constructor(private http: HttpClient) { }

  login(username: string, password: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(
      `${this.url}/Login`,
      { username, password }
    ).pipe(
      tap(res => {
        localStorage.setItem(this.tokenKey, res.token);
        this.isLoggedIn.next(true);
      })
    );
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    this.isLoggedIn.next(false);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getCurrentUser(): Observable<{ username: string }> {
    const token = this.getToken();
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
    return this.http.get<{ username: string }>(`${this.url}/CurrentUser`, { headers });
  }
}
