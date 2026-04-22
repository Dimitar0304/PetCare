import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Per-user settings persisted across reloads. Stored under a namespaced,
 * versioned `localStorage` key so values from previous schema versions can
 * be migrated or ignored safely.
 */
export type UserSettings = {
  /**
   * Absolute session timeout in minutes (from login time).
   * null means disabled (default).
   */
  sessionTimeoutMinutes: number | null;
};

const VERSION = 'v1';
const DEFAULTS: UserSettings = {
  sessionTimeoutMinutes: null,
};

function keyForUser(userId: string): string {
  return `user_settings_${VERSION}:${userId}`;
}

function safeParse(json: string | null): Partial<UserSettings> | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as Partial<UserSettings>;
  } catch {
    return null;
  }
}

/**
 * Normalizes a parsed settings blob by applying defaults and coercing
 * out-of-range values. Ensures consumers always receive a fully-populated,
 * well-formed {@link UserSettings} object.
 */
function normalize(v: Partial<UserSettings> | null): UserSettings {
  const minutesRaw = v?.sessionTimeoutMinutes;
  const minutes =
    typeof minutesRaw === 'number' && Number.isFinite(minutesRaw) && minutesRaw > 0 ? minutesRaw : null;

  return {
    ...DEFAULTS,
    sessionTimeoutMinutes: minutes,
  };
}

/**
 * Per-user settings store backed by `localStorage`. Exposes one
 * `BehaviorSubject` per user id and listens to `storage` events so that
 * changes made in other tabs are reflected in all subscribers live.
 */
@Injectable({ providedIn: 'root' })
export class UserSettingsService {
  private readonly subjects = new Map<string, BehaviorSubject<UserSettings>>();

  constructor() {
    window.addEventListener('storage', (e) => {
      if (!e.key) return;
      if (!e.key.startsWith(`user_settings_${VERSION}:`)) return;
      const userId = e.key.split(':')[1];
      if (!userId) return;
      const subj = this.subjects.get(userId);
      if (!subj) return;
      subj.next(normalize(safeParse(e.newValue)));
    });
  }

  /**
   * Returns (and lazily creates) the reactive settings stream for the user.
   * Subsequent calls for the same user return the same subject.
   */
  watch(userId: string): BehaviorSubject<UserSettings> {
    const existing = this.subjects.get(userId);
    if (existing) return existing;

    const initial = normalize(safeParse(localStorage.getItem(keyForUser(userId))));
    const subj = new BehaviorSubject<UserSettings>(initial);
    this.subjects.set(userId, subj);
    return subj;
  }

  /** Returns a one-off synchronous snapshot of the user's stored settings. */
  snapshot(userId: string): UserSettings {
    return normalize(safeParse(localStorage.getItem(keyForUser(userId))));
  }

  /**
   * Merges the supplied settings over the user's current settings and pushes
   * the result to any active subscribers.
   */
  setPartial(userId: string, next: Partial<UserSettings>): void {
    const merged: UserSettings = {
      ...this.snapshot(userId),
      ...next,
    };

    localStorage.setItem(keyForUser(userId), JSON.stringify(merged));
    this.watch(userId).next(merged);
  }
}

