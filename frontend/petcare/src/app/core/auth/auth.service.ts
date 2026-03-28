import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, finalize, map, of, tap, timeout } from 'rxjs';

import { BackendRoles, LoginPayload, LoginResponse, RegisterPayload, UserRole } from '../../models/auth.models';
import { environment } from '../../../environments/environment';

type JwtPayload = Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiBase = environment.apiBase;
  private readonly authUrl = `${this.apiBase}/Auth`;
  private readonly tokenKey = 'auth_token';
  private readonly userIdKey = 'auth_user_id';

  private readonly roleSubject = new BehaviorSubject<UserRole | null>(this.decodeRole(this.getToken()));
  readonly role$ = this.roleSubject.asObservable();

  private readonly loggedInSubject = new BehaviorSubject<boolean>(!!this.getToken());
  readonly loggedIn$ = this.loggedInSubject.asObservable();

  private readonly userIdSubject = new BehaviorSubject<string | null>(
    localStorage.getItem('auth_user_id')
  );
  readonly userId$ = this.userIdSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  login(payload: LoginPayload): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.authUrl}/login`, payload).pipe(
      // Prevent “infinite loading” if backend/DB stalls
      timeout(8000),
      tap((res) => {
        this.setToken(res.token);
        this.setUserId(res.userId);
        this.loggedInSubject.next(true);
        this.roleSubject.next(this.decodeRole(res.token));
      })
    );
  }

  register(payload: RegisterPayload): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.authUrl}/register`, payload).pipe(
      timeout(8000),
      tap((res) => {
        this.setToken(res.token);
        this.setUserId(res.userId);
        this.loggedInSubject.next(true);
        this.roleSubject.next(this.decodeRole(res.token));
      })
    );
  }

  logout(): Observable<unknown> {
    // Backend logout is authenticated. If the request fails, we still clear local state.
    const token = this.getToken();
    if (!token) {
      this.clearToken();
      this.loggedInSubject.next(false);
      this.roleSubject.next(null);
      return of(true);
    }

    return this.http.post(`${this.authUrl}/logout`, {}).pipe(
      map(() => true),
      finalize(() => {
        this.clearToken();
        this.loggedInSubject.next(false);
        this.roleSubject.next(null);
        this.userIdSubject.next(null);
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getRole(): UserRole | null {
    return this.roleSubject.value;
  }

  getUserId(): string | null {
    return this.userIdSubject.value;
  }

  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  private setUserId(userId: string): void {
    localStorage.setItem(this.userIdKey, userId);
    this.userIdSubject.next(userId);
  }

  private clearToken(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userIdKey);
  }

  private decodeRole(token: string | null): UserRole | null {
    if (!token) return null;

    try {
      const [, payloadB64] = token.split('.');
      if (!payloadB64) return null;

      const json = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
      const payload = JSON.parse(json) as JwtPayload;

      const roleRaw =
        (payload['role'] as string | undefined) ??
        (payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] as string | undefined);

      if (roleRaw === 'Seeker' || roleRaw === 'Provider') return roleRaw;
      // Fallback: if backend ever returns PetOwner/Petcarer, map them.
      if (roleRaw === BackendRoles.seeker) return 'Seeker';
      if (roleRaw === BackendRoles.provider) return 'Provider';

      return null;
    } catch {
      return null;
    }
  }
}

