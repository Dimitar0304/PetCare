import { RouterOutlet } from '@angular/router';
import { Component, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { inject } from '@angular/core';

import { NavbarComponent } from './shared/navbar/navbar.component';
import { UiPreferencesService } from './core/services/ui-preferences.service';
import { SessionTimerService } from './core/services/session-timer.service';

@Component({
  selector: 'app-root',
  standalone:true,
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
/**
 * Root application component.
 *
 * Responsibilities:
 * - Hosts the navbar and router outlet.
 * - Starts the {@link SessionTimerService} so login sessions can time out.
 * - Binds UI preferences (high-contrast, simplified view) to CSS classes on
 *   `<body>` so the rest of the app can react via global selectors.
 */
export class App {
  protected readonly title = signal('petcare');

  private readonly ui = inject(UiPreferencesService);
  private readonly document = inject(DOCUMENT);
  private readonly sessionTimer = inject(SessionTimerService);

  constructor() {
    this.sessionTimer.start();
    this.ui.prefs$.subscribe((p) => {
      const cls = this.document.body.classList;
      cls.toggle('high-contrast', p.highContrast);
      cls.toggle('simplified-ui', p.simplified);
    });
  }
}
