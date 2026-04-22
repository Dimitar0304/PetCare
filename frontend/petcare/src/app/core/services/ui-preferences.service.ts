import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/** Two-letter language code supported by the UI. */
export type LanguageCode = 'en' | 'bg';

/**
 * UI-level preferences persisted across reloads. These settings are shared
 * across users on the same device (they're not user-scoped).
 */
export type UiPreferences = {
  /** When true the app renders a simplified, reduced-density layout. */
  simplified: boolean;
  /** When true the high-contrast accessibility theme is enabled. */
  highContrast: boolean;
  /** Active UI language. */
  language: LanguageCode;
};

const STORAGE_KEY = 'ui_preferences_v1';

/**
 * Parses a persisted preferences payload back into a validated {@link UiPreferences}.
 * Coerces unknown or malformed values to safe defaults instead of throwing.
 */
function safeParse(json: string | null): UiPreferences | null {
  if (!json) return null;
  try {
    const v = JSON.parse(json) as Partial<UiPreferences>;
    const language = v.language === 'bg' ? 'bg' : 'en';
    return {
      simplified: Boolean(v.simplified),
      highContrast: Boolean(v.highContrast),
      language,
    };
  } catch {
    return null;
  }
}

/**
 * Reactive store for UI preferences backed by `localStorage`. Emits the current
 * preferences object and persists every change so the choices survive reloads.
 */
@Injectable({ providedIn: 'root' })
export class UiPreferencesService {
  private readonly subject = new BehaviorSubject<UiPreferences>(
    safeParse(localStorage.getItem(STORAGE_KEY)) ?? { simplified: false, highContrast: false, language: 'en' }
  );

  /** Stream of the current preferences object. */
  readonly prefs$ = this.subject.asObservable();

  /** Synchronous snapshot of the current preferences. */
  get snapshot(): UiPreferences {
    return this.subject.value;
  }

  /** Merges the supplied partial preferences and persists the result. */
  setPartial(next: Partial<UiPreferences>): void {
    const merged: UiPreferences = {
      ...this.subject.value,
      ...next,
    };
    this.subject.next(merged);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  }

  /** Toggles the `simplified` flag. */
  toggleSimplified(): void {
    this.setPartial({ simplified: !this.subject.value.simplified });
  }

  /** Toggles the `highContrast` flag. */
  toggleHighContrast(): void {
    this.setPartial({ highContrast: !this.subject.value.highContrast });
  }
}

