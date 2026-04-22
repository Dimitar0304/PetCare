import { Component, ElementRef, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { MessageService } from '../../core/services/message.service';
import { UiPreferencesService } from '../../core/services/ui-preferences.service';
import { TPipe } from '../../core/i18n/t.pipe';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, TPipe],
  styleUrl: './navbar.component.css',
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container">
        <a class="navbar-brand" routerLink="/">Petcare</a>

        <div class="collapse navbar-collapse show">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item">
              <a class="nav-link" routerLink="/ads" routerLinkActive="active">{{ 'nav.ads' | t }}</a>
            </li>

            <li class="nav-item">
              <a class="nav-link" routerLink="/weather" routerLinkActive="active">{{ 'nav.weather' | t }}</a>
            </li>

            <li class="nav-item" *ngIf="(auth.role$ | async) === 'Seeker'">
              <a class="nav-link" routerLink="/ads/create" routerLinkActive="active">{{ 'nav.createAd' | t }}</a>
            </li>

            <li class="nav-item" *ngIf="auth.loggedIn$ | async">
              <a class="nav-link position-relative" routerLink="/inbox" routerLinkActive="active">
                {{ 'nav.inbox' | t }}
                <span
                  class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                  style="font-size: 0.65rem;"
                  *ngIf="(messageService.unreadCount$ | async)! > 0"
                >
                  {{ messageService.unreadCount$ | async }}
                </span>
              </a>
            </li>

            <li class="nav-item" *ngIf="(auth.role$ | async) === 'Admin'">
              <a class="nav-link" routerLink="/admin" routerLinkActive="active">Admin</a>
            </li>
          </ul>

          <div class="d-flex align-items-center gap-3 position-relative">
            <button
              class="btn btn-outline-light btn-sm"
              type="button"
              (click)="toggleAccount($event)"
            >
              {{ 'nav.account' | t }}
              <span class="ms-2" *ngIf="auth.loggedIn$ | async">({{ auth.role$ | async }})</span>
            </button>

            <div
              *ngIf="accountOpen"
              class="position-absolute end-0 mt-2 bg-dark border border-secondary rounded shadow p-3"
              style="min-width: 220px; z-index: 1000; top: 100%;"
            >
              <ng-container *ngIf="auth.loggedIn$ | async; else authLinks">
                <div class="text-light small mb-2">
                  {{ 'nav.role' | t }}: <strong>{{ auth.role$ | async }}</strong>
                </div>

                <button class="btn btn-outline-light btn-sm w-100 mb-2" type="button" (click)="ui.toggleHighContrast()">
                  {{ (ui.prefs$ | async)?.highContrast ? ('nav.highContrastOff' | t) : ('nav.highContrastOn' | t) }}
                </button>

                <button
                  class="btn btn-outline-light btn-sm w-100 mb-2"
                  type="button"
                  (click)="goToSettings()"
                >
                  {{ 'nav.settings' | t }}
                </button>

                <div class="text-light small mb-1">{{ 'nav.language' | t }}</div>
                <div class="d-grid gap-2 mb-2">
                  <button class="btn btn-outline-light btn-sm w-100" type="button"
                    (click)="ui.setPartial({ language: 'en' })">
                    {{ 'nav.langEn' | t }}
                  </button>
                  <button class="btn btn-outline-light btn-sm w-100" type="button"
                    (click)="ui.setPartial({ language: 'bg' })">
                    {{ 'nav.langBg' | t }}
                  </button>
                </div>

                <button class="btn btn-outline-light btn-sm w-100" type="button"
                  (click)="onLogout(); accountOpen = false">
                  {{ 'nav.logout' | t }}
                </button>
              </ng-container>

              <ng-template #authLinks>
                <div class="d-grid gap-2">
                  <a class="btn btn-outline-light btn-sm w-100" routerLink="/login"
                    (click)="accountOpen = false">{{ 'nav.login' | t }}</a>
                  <a class="btn btn-outline-light btn-sm w-100" routerLink="/register"
                    (click)="accountOpen = false">{{ 'nav.register' | t }}</a>
                </div>
              </ng-template>
            </div>
          </div>
        </div>
      </div>
    </nav>
  `,
})
/**
 * Top-level navigation bar. Displays role-dependent links (e.g. "Create ad"
 * for seekers, "Admin" for admins), a dropdown account menu that exposes
 * preferences (high-contrast theme, language, settings page, logout), and
 * an inbox badge driven by {@link MessageService.unreadCount$}.
 *
 * A document-level click listener closes the account menu when the user
 * clicks anywhere outside the component.
 */
export class NavbarComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly messageService = inject(MessageService);
  readonly ui = inject(UiPreferencesService);

  private readonly rootEl = inject(ElementRef<HTMLElement>);
  private readonly router = inject(Router);

  accountOpen = false;

  ngOnInit(): void {
    // Load unread count whenever user is authenticated
    this.auth.loggedIn$.subscribe((loggedIn) => {
      if (loggedIn) {
        this.messageService.loadUnreadCount();
      } else {
        this.messageService.unreadCount$.next(0);
      }
    });
  }

  /**
   * Opens or closes the account dropdown. Stops propagation so the document
   * click listener does not immediately close the menu that was just opened.
   */
  toggleAccount(event: MouseEvent): void {
    event.stopPropagation();
    this.accountOpen = !this.accountOpen;
  }

  /** Closes the account dropdown when the user clicks outside the navbar. */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node | null;
    if (!target) return;
    if (!this.rootEl.nativeElement.contains(target)) {
      this.accountOpen = false;
    }
  }

  /**
   * Logs the user out and navigates to the login page. The navigation fires
   * on both success and failure so the user is never stranded with stale state.
   */
  onLogout(): void {
    this.auth.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }

  /** Closes the account dropdown and navigates to the settings page. */
  goToSettings(): void {
    this.accountOpen = false;
    this.router.navigate(['/settings']);
  }
}
