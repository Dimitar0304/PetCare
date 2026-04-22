import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Legacy authentication service kept for backwards compatibility with the
 * original login screen. New code should use
 * {@link core/auth/auth.service.AuthService} instead.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private url = 'https://localhost:7072/api/Auth/login'
  private tokenKey = 'auth_token';

  /** Emits `true` when an access token is present in `localStorage`. */
  public isLoggedIn = new BehaviorSubject<boolean>(!!this.getToken());

  constructor(private http: HttpClient) { }

  /**
   * Performs a login request against the legacy endpoint and stores the
   * returned token.
   */
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

  /** Removes the stored token and marks the user as logged out. */
  logout() {
    localStorage.removeItem(this.tokenKey);
    this.isLoggedIn.next(false);
  }

  /** Returns the currently stored access token, if any. */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Fetches the current user's profile from the backend, authenticating
   * with the stored bearer token when available.
   */
  getCurrentUser(): Observable<{ username: string }> {
    const token = this.getToken();
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
    return this.http.get<{ username: string }>(`${this.url}/CurrentUser`, { headers });
  }
}
