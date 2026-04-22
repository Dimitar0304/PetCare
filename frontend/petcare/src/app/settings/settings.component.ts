import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService } from '../core/auth/auth.service';
import { UserSettingsService } from '../core/services/user-settings.service';
import { TPipe } from '../core/i18n/t.pipe';

type Option = { label: string; value: number | null };

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterModule, TPipe],
  template: `
    <div class="container py-4">
      <div class="d-flex align-items-center justify-content-between mb-3">
        <h2 class="mb-0">{{ 'settings.title' | t }}</h2>
        <a class="btn btn-outline-secondary btn-sm" routerLink="/ads">{{ 'settings.back' | t }}</a>
      </div>

      <div class="card bg-dark text-light border-secondary">
        <div class="card-body">
          <h5 class="card-title mb-3">{{ 'settings.session.title' | t }}</h5>

          <div class="mb-2 text-secondary small">
            {{ 'settings.session.help' | t }}
          </div>

          <div class="row g-3 align-items-center">
            <div class="col-12 col-md-6">
              <label class="form-label">{{ 'settings.session.timeoutLabel' | t }}</label>
              <select class="form-select" [value]="selected" (change)="onSelect($event)">
                <option *ngFor="let o of options" [value]="o.value === null ? '' : o.value">
                  {{ o.label }}
                </option>
              </select>
            </div>

            <div class="col-12 col-md-6">
              <div class="alert alert-secondary mb-0" *ngIf="selected === ''">
                {{ 'settings.session.disabled' | t }}
              </div>
              <div class="alert alert-warning mb-0" *ngIf="selected !== ''">
                {{ 'settings.session.enabledPrefix' | t }} {{ selected }} {{ 'settings.session.minutesSuffix' | t }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
/**
 * Settings page hosting user-scoped preferences.
 *
 * Currently exposes the optional session-timeout feature. The timeout is
 * disabled by default; when enabled, {@link SessionTimerService} logs the
 * user out `sessionTimeoutMinutes` minutes after login.
 */
export class SettingsComponent implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly userSettings = inject(UserSettingsService);

  private sub: Subscription | null = null;
  private userId: string | null = null;

  // empty string means disabled
  selected = '';

  readonly options: Option[] = [
    { label: 'Disabled', value: null },
    { label: '15 minutes', value: 15 },
    { label: '30 minutes', value: 30 },
    { label: '60 minutes', value: 60 },
    { label: '120 minutes', value: 120 },
  ];

  ngOnInit(): void {
    this.sub = this.auth.userId$.subscribe((id) => {
      this.userId = id;
      if (!id) return;
      const snap = this.userSettings.snapshot(id);
      this.selected = snap.sessionTimeoutMinutes ? String(snap.sessionTimeoutMinutes) : '';
    });
  }

  /**
   * Persists the selected session-timeout choice for the current user.
   * An empty option is treated as "disabled".
   */
  onSelect(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selected = value;
    if (!this.userId) return;
    const minutes = value === '' ? null : Number(value);
    this.userSettings.setPartial(this.userId, { sessionTimeoutMinutes: minutes });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}

