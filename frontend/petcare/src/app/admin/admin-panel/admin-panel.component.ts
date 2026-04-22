import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs';

import { AdminService } from '../admin.service';
import { AdminAdDto, AdminMessageDto } from '../admin.models';

type Tab = 'ads' | 'messages';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container py-4">
      <div class="d-flex align-items-center justify-content-between mb-3">
        <div>
          <div class="text-muted small">Admin</div>
          <h2 class="mb-0">Moderation</h2>
        </div>
        <a class="btn btn-outline-secondary btn-sm" routerLink="/ads">Back</a>
      </div>

      <ul class="nav nav-tabs mb-3">
        <li class="nav-item">
          <button class="nav-link" [class.active]="tab === 'ads'" (click)="switchTab('ads')">Ads</button>
        </li>
        <li class="nav-item">
          <button class="nav-link" [class.active]="tab === 'messages'" (click)="switchTab('messages')">Messages</button>
        </li>
      </ul>

      <div class="alert alert-danger" *ngIf="error">{{ error }}</div>

      <div *ngIf="loading" class="d-flex align-items-center gap-2 text-muted">
        <span class="spinner-border spinner-border-sm"></span> Loading…
      </div>

      <ng-container *ngIf="!loading && tab === 'ads'">
        <div class="text-muted small mb-2">Showing {{ ads.length }} of {{ adsTotal }}</div>
        <div class="list-group">
          <div class="list-group-item" *ngFor="let ad of ads">
            <div class="d-flex justify-content-between gap-3">
              <div class="flex-grow-1">
                <div class="fw-semibold">{{ ad.title }}</div>
                <div class="text-muted small">
                  {{ ad.town }} · {{ ad.price }} BGN · Owner: {{ ad.ownerEmail || ad.ownerId }}
                </div>
                <div class="small mt-2" style="white-space: pre-wrap;">{{ ad.description }}</div>
              </div>
              <div class="text-end">
                <button class="btn btn-outline-danger btn-sm" type="button" (click)="deleteAd(ad)">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-3 d-flex justify-content-end">
          <button class="btn btn-outline-primary btn-sm" type="button"
            (click)="loadMoreAds()" [disabled]="loadingMore || ads.length >= adsTotal">
            {{ ads.length >= adsTotal ? 'No more' : (loadingMore ? 'Loading…' : 'Load more') }}
          </button>
        </div>
      </ng-container>

      <ng-container *ngIf="!loading && tab === 'messages'">
        <div class="text-muted small mb-2">Showing {{ messages.length }} of {{ messagesTotal }}</div>
        <div class="list-group">
          <div class="list-group-item" *ngFor="let m of messages">
            <div class="d-flex justify-content-between align-items-start gap-3">
              <div class="flex-grow-1">
                <div class="d-flex align-items-center gap-2">
                  <span class="badge bg-secondary" *ngIf="!m.isRead">Unread</span>
                  <span class="fw-semibold">{{ m.subject }}</span>
                </div>
                <div class="text-muted small mt-1">
                  From: {{ m.senderEmail }} · To: {{ m.recipientEmail }} · {{ m.sentAt | date: 'dd MMM yyyy HH:mm' }}
                </div>
                <div class="small mt-2" style="white-space: pre-wrap;">{{ m.body }}</div>
              </div>
              <div class="text-end d-flex flex-column gap-2">
                <button class="btn btn-outline-success btn-sm" type="button" (click)="markRead(m)" [disabled]="m.isRead">
                  Mark read
                </button>
                <button class="btn btn-outline-danger btn-sm" type="button" (click)="deleteMessage(m)">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-3 d-flex justify-content-end">
          <button class="btn btn-outline-primary btn-sm" type="button"
            (click)="loadMoreMessages()" [disabled]="loadingMore || messages.length >= messagesTotal">
            {{ messages.length >= messagesTotal ? 'No more' : (loadingMore ? 'Loading…' : 'Load more') }}
          </button>
        </div>
      </ng-container>
    </div>
  `,
})
/**
 * Admin moderation panel with two tabs: ads and messages.
 *
 * Loads data lazily (the first tab loads in the constructor, the other tab
 * loads on first visit) and supports "load more" pagination. All requests
 * go through {@link AdminService}, which only succeeds for users with the
 * `Admin` role.
 */
export class AdminPanelComponent {
  private readonly admin = inject(AdminService);

  tab: Tab = 'ads';
  loading = false;
  loadingMore = false;
  error: string | null = null;

  ads: AdminAdDto[] = [];
  adsTotal = 0;
  private adsPage = 1;

  messages: AdminMessageDto[] = [];
  messagesTotal = 0;
  private messagesPage = 1;

  private readonly pageSize = 20;

  constructor() {
    this.loadAds(true);
  }

  /** Switches between the `ads` and `messages` tabs, lazy-loading data on first visit. */
  switchTab(tab: Tab): void {
    if (this.tab === tab) return;
    this.tab = tab;
    this.error = null;
    if (tab === 'ads' && this.ads.length === 0) this.loadAds(true);
    if (tab === 'messages' && this.messages.length === 0) this.loadMessages(true);
  }

  /**
   * Loads a page of ads. When `reset` is true, pagination state and the
   * current list are cleared before the request.
   */
  private loadAds(reset: boolean): void {
    this.loading = true;
    if (reset) {
      this.adsPage = 1;
      this.ads = [];
      this.adsTotal = 0;
    }

    this.admin
      .getAds(this.adsPage, this.pageSize)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.adsTotal = res.total;
          this.ads = reset ? res.items : [...this.ads, ...res.items];
        },
        error: () => (this.error = 'Failed to load ads.'),
      });
  }

  /** Appends the next page of ads to the current list. */
  loadMoreAds(): void {
    if (this.loadingMore || this.ads.length >= this.adsTotal) return;
    this.loadingMore = true;
    const nextPage = this.adsPage + 1;
    this.admin
      .getAds(nextPage, this.pageSize)
      .pipe(finalize(() => (this.loadingMore = false)))
      .subscribe({
        next: (res) => {
          this.adsPage = nextPage;
          this.adsTotal = res.total;
          this.ads = [...this.ads, ...res.items];
        },
        error: () => (this.error = 'Failed to load more ads.'),
      });
  }

  /** Confirms then deletes an ad regardless of ownership. */
  deleteAd(ad: AdminAdDto): void {
    const ok = confirm(`Delete ad "${ad.title}"?`);
    if (!ok) return;
    this.admin.deleteAd(ad.id).subscribe({
      next: () => this.loadAds(true),
      error: () => (this.error = 'Failed to delete ad.'),
    });
  }

  /**
   * Loads a page of messages. When `reset` is true, pagination state and the
   * current list are cleared before the request.
   */
  private loadMessages(reset: boolean): void {
    this.loading = true;
    if (reset) {
      this.messagesPage = 1;
      this.messages = [];
      this.messagesTotal = 0;
    }

    this.admin
      .getMessages(this.messagesPage, this.pageSize)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.messagesTotal = res.total;
          this.messages = reset ? res.items : [...this.messages, ...res.items];
        },
        error: () => (this.error = 'Failed to load messages.'),
      });
  }

  /** Appends the next page of messages to the current list. */
  loadMoreMessages(): void {
    if (this.loadingMore || this.messages.length >= this.messagesTotal) return;
    this.loadingMore = true;
    const nextPage = this.messagesPage + 1;
    this.admin
      .getMessages(nextPage, this.pageSize)
      .pipe(finalize(() => (this.loadingMore = false)))
      .subscribe({
        next: (res) => {
          this.messagesPage = nextPage;
          this.messagesTotal = res.total;
          this.messages = [...this.messages, ...res.items];
        },
        error: () => (this.error = 'Failed to load more messages.'),
      });
  }

  /** Marks a message as read, updating the DTO optimistically. */
  markRead(m: AdminMessageDto): void {
    if (m.isRead) return;
    this.admin.markMessageRead(m.id).subscribe({
      next: () => (m.isRead = true),
      error: () => (this.error = 'Failed to mark message as read.'),
    });
  }

  /** Confirms then permanently deletes a message. */
  deleteMessage(m: AdminMessageDto): void {
    const ok = confirm(`Delete message "${m.subject}"?`);
    if (!ok) return;
    this.admin.deleteMessage(m.id).subscribe({
      next: () => this.loadMessages(true),
      error: () => (this.error = 'Failed to delete message.'),
    });
  }
}

