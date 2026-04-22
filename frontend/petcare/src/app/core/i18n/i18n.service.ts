import { Injectable } from '@angular/core';
import { map } from 'rxjs';

import { UiPreferencesService } from '../services/ui-preferences.service';
import { BG, EN, TranslationKey, Translations } from './translations';

/**
 * Lightweight translation service. The active language is read from
 * {@link UiPreferencesService} so toggling language in settings
 * propagates to every consumer through the `language$` stream.
 */
@Injectable({ providedIn: 'root' })
export class I18nService {
  /** Stream emitting the currently selected language code (e.g. `'en'` / `'bg'`). */
  readonly language$;

  constructor(private readonly ui: UiPreferencesService) {
    this.language$ = this.ui.prefs$.pipe(map((p) => p.language));
  }

  /**
   * Translates a known key to the active language. Returns the key itself
   * when no entry is defined so missing translations are visible but not fatal.
   */
  translate(key: TranslationKey): string {
    const lang = this.ui.snapshot.language;
    const dict: Translations = lang === 'bg' ? BG : EN;
    return dict[key] ?? key;
  }
}

