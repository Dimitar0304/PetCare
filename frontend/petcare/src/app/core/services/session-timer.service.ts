import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { combineLatest, distinctUntilChanged, map, Subscription } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { UserSettingsService } from './user-settings.service';

const SESSION_STARTED_VERSION = 'v1';

/** Builds the `localStorage` key used to track a user's session start time. */
function startedAtKey(userId: string): string {
  return `session_started_at_${SESSION_STARTED_VERSION}:${userId}`;
}

/** Returns the stored session-start timestamp (ms since epoch) for the user, or `null`. */
function readStartedAtMs(userId: string): number | null {
  const raw = localStorage.getItem(startedAtKey(userId));
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function writeStartedAtMs(userId: string, ms: number): void {
  localStorage.setItem(startedAtKey(userId), String(ms));
}

function clearStartedAtMs(userId: string): void {
  localStorage.removeItem(startedAtKey(userId));
}

/**
 * Enforces an optional absolute session timeout configured in the user
 * settings. When enabled, the user is logged out automatically after
 * `sessionTimeoutMinutes` minutes counted from the original login time
 * (not from the last activity).
 *
 * The service reacts to both authentication state changes and live setting
 * changes so toggling the timeout takes effect immediately.
 */
@Injectable({ providedIn: 'root' })
export class SessionTimerService {
  private readonly auth = inject(AuthService);
  private readonly settings = inject(UserSettingsService);
  private readonly router = inject(Router);

  private timerId: number | null = null;
  private authSub: Subscription | null = null;
  private settingsSub: Subscription | null = null;

  /**
   * Starts the timer loop. Safe to call multiple times — subsequent calls
   * are ignored until the underlying subscription is disposed.
   */
  start(): void {
    if (this.authSub) return;

    this.authSub = combineLatest([this.auth.loggedIn$, this.auth.userId$])
      .pipe(
        map(([loggedIn, userId]) => ({ loggedIn, userId })),
        distinctUntilChanged((a, b) => a.loggedIn === b.loggedIn && a.userId === b.userId)
      )
      .subscribe(({ loggedIn, userId }) => {
        this.clearTimer();
        this.settingsSub?.unsubscribe();
        this.settingsSub = null;
        if (!loggedIn || !userId) return;

        // Ensure a session start exists (default behavior: no timeout until user enables it)
        const now = Date.now();
        const startedAt = readStartedAtMs(userId) ?? now;
        if (!readStartedAtMs(userId)) writeStartedAtMs(userId, startedAt);

        const subj = this.settings.watch(userId);
        this.settingsSub = subj
          .pipe(
            map((s) => s.sessionTimeoutMinutes),
            distinctUntilChanged()
          )
          .subscribe((minutes) => {
            this.clearTimer();
            if (!minutes) return; // disabled by default

            const expiresAt = startedAt + minutes * 60_000;
            const remainingMs = expiresAt - Date.now();

            if (remainingMs <= 0) {
              this.forceLogout();
              return;
            }

            this.timerId = window.setTimeout(() => this.forceLogout(), remainingMs);
          });
      });
  }

  /** Stores the current time as the session-start timestamp for the given user. */
  recordSessionStart(userId: string): void {
    writeStartedAtMs(userId, Date.now());
  }

  /** Clears the stored session-start timestamp for the given user. */
  clearSessionStart(userId: string): void {
    clearStartedAtMs(userId);
  }

  private clearTimer(): void {
    if (this.timerId != null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * Logs the user out and navigates to the login page. Navigation is performed
   * on both success and failure paths so a server-side logout error does not
   * leave the user stranded on an authenticated route.
   */
  private forceLogout(): void {
    this.auth.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }
}

