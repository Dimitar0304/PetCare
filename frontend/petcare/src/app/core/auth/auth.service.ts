import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, finalize, map, of, tap, timeout } from 'rxjs';

import { BackendRoles, LoginPayload, LoginResponse, RegisterPayload, UserRole } from '../../models/auth.models';
import { environment } from '../../../environments/environment';

type JwtPayload = Record<string, unknown>;

/**
 * Authentication service that owns the JWT lifecycle for the Angular client.
 *
 * Responsibilities:
 * - Calls the backend `login`/`register`/`logout` endpoints.
 * - Persists the access token and user id in `localStorage`.
 * - Decodes the JWT to extract the user role and exposes reactive streams
 *   (`role$`, `loggedIn$`, `userId$`) that the rest of the app consumes.
 * - Tracks a "session started at" timestamp per user used by the optional
 *   session-timeout feature.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiBase = environment.apiBase;
  private readonly authUrl = `${this.apiBase}/Auth`;
  private readonly tokenKey = 'auth_token';
  private readonly userIdKey = 'auth_user_id';
  private readonly sessionStartedVersion = 'v1';

  private readonly roleSubject = new BehaviorSubject<UserRole | null>(this.decodeRole(this.getToken()));
  /** Stream emitting the current user's role, or `null` when logged out. */
  readonly role$ = this.roleSubject.asObservable();

  private readonly loggedInSubject = new BehaviorSubject<boolean>(!!this.getToken());
  /** Stream emitting `true` while a token is stored in `localStorage`. */
  readonly loggedIn$ = this.loggedInSubject.asObservable();

  private readonly userIdSubject = new BehaviorSubject<string | null>(
    localStorage.getItem('auth_user_id')
  );
  /** Stream emitting the current user id, or `null` when logged out. */
  readonly userId$ = this.userIdSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  /**
   * Authenticates the user and stores the returned token + user id.
   *
   * The 8-second timeout guards against the UI being stuck on "loading"
   * when the backend or database stalls (e.g. cold-start in containers).
   */
  login(payload: LoginPayload): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.authUrl}/login`, payload).pipe(
      // Prevent “infinite loading” if backend/DB stalls
      timeout(8000),
      tap((res) => {
        this.setToken(res.token);
        this.setUserId(res.userId);
        this.setSessionStartedAt(res.userId, Date.now());
        this.loggedInSubject.next(true);
        this.roleSubject.next(this.decodeRole(res.token));
      })
    );
  }

  /**
   * Registers a new user, stores the returned token and immediately starts
   * a session in the same way as {@link login}.
   */
  register(payload: RegisterPayload): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.authUrl}/register`, payload).pipe(
      timeout(8000),
      tap((res) => {
        this.setToken(res.token);
        this.setUserId(res.userId);
        this.setSessionStartedAt(res.userId, Date.now());
        this.loggedInSubject.next(true);
        this.roleSubject.next(this.decodeRole(res.token));
      })
    );
  }

  /**
   * Logs the user out. Calls the backend logout endpoint (to match audit logs)
   * but always clears the client-side state in the `finalize` block even when
   * the HTTP call fails.
   */
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
        const userId = this.getUserId();
        if (userId) this.clearSessionStartedAt(userId);
        this.clearToken();
        this.loggedInSubject.next(false);
        this.roleSubject.next(null);
        this.userIdSubject.next(null);
      })
    );
  }

  /** Returns the current JWT access token or `null` when logged out. */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /** Returns the current role synchronously (or `null`). */
  getRole(): UserRole | null {
    return this.roleSubject.value;
  }

  /** Returns the current user id synchronously (or `null`). */
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

  private sessionStartedKey(userId: string): string {
    return `session_started_at_${this.sessionStartedVersion}:${userId}`;
  }

  private setSessionStartedAt(userId: string, ms: number): void {
    localStorage.setItem(this.sessionStartedKey(userId), String(ms));
  }

  private clearSessionStartedAt(userId: string): void {
    localStorage.removeItem(this.sessionStartedKey(userId));
  }

  /**
   * Decodes the JWT body to extract the role claim.
   *
   * Accepts both the short `role` claim (used by the backend for the frontend)
   * and the long ASP.NET-style claim URI. Also maps legacy backend role names
   * (`PetOwner`/`Petcarer`) to the canonical `Seeker`/`Provider` labels.
   * Any malformed token results in `null` rather than an exception.
   */
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

      if (roleRaw === 'Seeker' || roleRaw === 'Provider' || roleRaw === 'Admin') return roleRaw;
      // Fallback: if backend ever returns PetOwner/Petcarer, map them.
      if (roleRaw === BackendRoles.seeker) return 'Seeker';
      if (roleRaw === BackendRoles.provider) return 'Provider';

      return null;
    } catch {
      return null;
    }
  }
}

