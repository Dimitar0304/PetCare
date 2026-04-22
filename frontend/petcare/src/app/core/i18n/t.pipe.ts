import { Pipe, PipeTransform } from '@angular/core';

import { I18nService } from './i18n.service';
import { TranslationKey } from './translations';

/**
 * Template pipe that resolves a {@link TranslationKey} via {@link I18nService}.
 *
 * The pipe is declared `pure: false` so the view re-renders when the user
 * changes language, because `I18nService.translate` reads a mutable state
 * snapshot rather than a constant input.
 *
 * @example
 * ```html
 * <button>{{ 'nav.logout' | t }}</button>
 * ```
 */
@Pipe({
  name: 't',
  standalone: true,
  pure: false,
})
export class TPipe implements PipeTransform {
  constructor(private readonly i18n: I18nService) {}

  transform(key: TranslationKey): string {
    return this.i18n.translate(key);
  }
}

