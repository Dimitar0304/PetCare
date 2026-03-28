import { Component, ElementRef, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { MessageService } from '../../core/services/message.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  styleUrl: './navbar.component.css',
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container">
        <a class="navbar-brand" routerLink="/">Petcare</a>

        <div class="collapse navbar-collapse show">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item">
              <a class="nav-link" routerLink="/ads" routerLinkActive="active">Ads</a>
            </li>

            <li class="nav-item" *ngIf="(auth.role$ | async) === 'Seeker'">
              <a class="nav-link" routerLink="/ads/create" routerLinkActive="active">Create ad</a>
            </li>

            <li class="nav-item" *ngIf="auth.loggedIn$ | async">
              <a class="nav-link position-relative" routerLink="/inbox" routerLinkActive="active">
                Inbox
                <span
                  class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                  style="font-size: 0.65rem;"
                  *ngIf="(messageService.unreadCount$ | async)! > 0"
                >
                  {{ messageService.unreadCount$ | async }}
                </span>
              </a>
            </li>
          </ul>

          <div class="d-flex align-items-center gap-3 position-relative">
            <button
              class="btn btn-outline-light btn-sm"
              type="button"
              (click)="toggleAccount($event)"
            >
              Account
              <span class="ms-2" *ngIf="auth.loggedIn$ | async">({{ auth.role$ | async }})</span>
            </button>

            <div
              *ngIf="accountOpen"
              class="position-absolute end-0 mt-2 bg-dark border border-secondary rounded shadow p-3"
              style="min-width: 220px; z-index: 1000; top: 100%;"
            >
              <ng-container *ngIf="auth.loggedIn$ | async; else authLinks">
                <div class="text-light small mb-2">
                  Role: <strong>{{ auth.role$ | async }}</strong>
                </div>

                <button class="btn btn-outline-light btn-sm w-100" type="button"
                  (click)="onLogout(); accountOpen = false">
                  Logout
                </button>
              </ng-container>

              <ng-template #authLinks>
                <div class="d-grid gap-2">
                  <a class="btn btn-outline-light btn-sm w-100" routerLink="/login"
                    (click)="accountOpen = false">Login</a>
                  <a class="btn btn-outline-light btn-sm w-100" routerLink="/register"
                    (click)="accountOpen = false">Register</a>
                </div>
              </ng-template>
            </div>
          </div>
        </div>
      </div>
    </nav>
  `,
})
export class NavbarComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly messageService = inject(MessageService);

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

  toggleAccount(event: MouseEvent): void {
    event.stopPropagation();
    this.accountOpen = !this.accountOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node | null;
    if (!target) return;
    if (!this.rootEl.nativeElement.contains(target)) {
      this.accountOpen = false;
    }
  }

  onLogout(): void {
    this.auth.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }
}
