import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';

import { MessageService } from '../core/services/message.service';
import { MessageDto } from '../models/message.models';

type Tab = 'inbox' | 'sent';

@Component({
  selector: 'app-inbox',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  styleUrl: './inbox.component.css',
  template: `
    <div class="container py-4">
      <div class="d-flex align-items-center justify-content-between mb-4">
        <h2 class="mb-0">Inbox</h2>
        <button class="btn btn-primary btn-sm" type="button" (click)="openCompose()">
          ✉ New Message
        </button>
      </div>

      <!-- Compose panel -->
      <div class="card mb-4 border-primary" *ngIf="showCompose">
        <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <span>New Message</span>
          <button class="btn-close btn-close-white btn-sm" type="button" (click)="closeCompose()"></button>
        </div>
        <div class="card-body">
          <form [formGroup]="composeForm" (ngSubmit)="sendMessage()">
            <div class="mb-3">
              <label class="form-label">To (email)</label>
              <input
                class="form-control"
                formControlName="recipientEmail"
                type="email"
                placeholder="user@example.com"
              />
              <div class="text-danger small"
                *ngIf="composeForm.controls.recipientEmail.invalid && composeForm.controls.recipientEmail.touched">
                Valid email is required.
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label">Subject</label>
              <input class="form-control" formControlName="subject" placeholder="Subject" />
              <div class="text-danger small"
                *ngIf="composeForm.controls.subject.invalid && composeForm.controls.subject.touched">
                Subject is required.
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label">Message</label>
              <textarea class="form-control" rows="5" formControlName="body" placeholder="Write your message here..."></textarea>
              <div class="text-danger small"
                *ngIf="composeForm.controls.body.invalid && composeForm.controls.body.touched">
                Message body is required.
              </div>
            </div>

            <div class="alert alert-danger" *ngIf="sendError">{{ sendError }}</div>
            <div class="alert alert-success" *ngIf="sendSuccess">Message sent!</div>

            <div class="d-flex gap-2 justify-content-end">
              <button class="btn btn-secondary btn-sm" type="button" (click)="closeCompose()">Cancel</button>
              <button class="btn btn-primary btn-sm" type="submit"
                [disabled]="composeForm.invalid || sending">
                {{ sending ? 'Sending…' : 'Send' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Tabs -->
      <ul class="nav nav-tabs mb-3">
        <li class="nav-item">
          <button class="nav-link" [class.active]="activeTab === 'inbox'" (click)="switchTab('inbox')">
            Inbox
            <span class="badge bg-danger ms-1" *ngIf="unreadCount > 0">{{ unreadCount }}</span>
          </button>
        </li>
        <li class="nav-item">
          <button class="nav-link" [class.active]="activeTab === 'sent'" (click)="switchTab('sent')">
            Sent
          </button>
        </li>
      </ul>

      <div *ngIf="loading" class="d-flex align-items-center gap-2 text-muted">
        <span class="spinner-border spinner-border-sm"></span> Loading…
      </div>
      <div class="alert alert-danger" *ngIf="loadError">{{ loadError }}</div>

      <!-- Message list -->
      <div *ngIf="!loading && messages.length === 0 && !loadError" class="text-muted">
        No messages here yet.
      </div>

      <div class="list-group" *ngIf="!loading && messages.length > 0">
        <div
          class="list-group-item list-group-item-action"
          [class.fw-bold]="activeTab === 'inbox' && !msg.isRead"
          *ngFor="let msg of messages"
          (click)="openMessage(msg)"
          style="cursor: pointer;"
        >
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div class="d-flex align-items-center gap-2">
                <span class="badge bg-secondary" *ngIf="activeTab === 'inbox' && !msg.isRead">New</span>
                <span>{{ msg.subject }}</span>
              </div>
              <div class="text-muted small mt-1">
                <span *ngIf="activeTab === 'inbox'">From: {{ msg.senderEmail }}</span>
                <span *ngIf="activeTab === 'sent'">To: {{ msg.recipientEmail }}</span>
              </div>
            </div>
            <div class="text-muted small text-nowrap ms-3">{{ msg.sentAt | date: 'dd MMM HH:mm' }}</div>
          </div>
        </div>
      </div>

      <!-- Selected message detail -->
      <div class="card mt-4" *ngIf="selectedMsg">
        <div class="card-header d-flex justify-content-between align-items-center">
          <strong>{{ selectedMsg.subject }}</strong>
          <button class="btn-close" type="button" (click)="selectedMsg = null"></button>
        </div>
        <div class="card-body">
          <div class="text-muted small mb-3">
            <span *ngIf="activeTab === 'inbox'">From: <strong>{{ selectedMsg.senderEmail }}</strong></span>
            <span *ngIf="activeTab === 'sent'">To: <strong>{{ selectedMsg.recipientEmail }}</strong></span>
            &nbsp;·&nbsp;{{ selectedMsg.sentAt | date: 'dd MMM yyyy HH:mm' }}
          </div>
          <p style="white-space: pre-wrap;">{{ selectedMsg.body }}</p>
          <button
            class="btn btn-sm btn-outline-secondary"
            type="button"
            *ngIf="activeTab === 'inbox'"
            (click)="replyTo(selectedMsg)"
          >
            Reply
          </button>
        </div>
      </div>
    </div>
  `,
})
export class InboxComponent implements OnInit {
  private readonly messageService = inject(MessageService);
  private readonly route = inject(ActivatedRoute);

  activeTab: Tab = 'inbox';
  messages: MessageDto[] = [];
  loading = false;
  loadError: string | null = null;
  selectedMsg: MessageDto | null = null;

  showCompose = false;
  sending = false;
  sendError: string | null = null;
  sendSuccess = false;

  unreadCount = 0;

  composeForm = new FormGroup({
    recipientEmail: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    subject: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    body: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
  });

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['compose'] === 'true') {
        this.openCompose();
        const to = params['to'];
        if (to && to.includes('@')) {
          this.composeForm.patchValue({ recipientEmail: to });
        }
      }
    });
    this.loadMessages();
  }

  switchTab(tab: Tab): void {
    if (this.activeTab === tab) return;
    this.activeTab = tab;
    this.selectedMsg = null;
    this.loadMessages();
  }

  openCompose(): void {
    this.composeForm.reset();
    this.sendError = null;
    this.sendSuccess = false;
    this.showCompose = true;
  }

  closeCompose(): void {
    this.showCompose = false;
  }

  sendMessage(): void {
    if (this.composeForm.invalid) return;
    this.sending = true;
    this.sendError = null;
    this.sendSuccess = false;

    const raw = this.composeForm.getRawValue();
    this.messageService
      .sendMessage({ recipientEmail: raw.recipientEmail, subject: raw.subject, body: raw.body })
      .pipe(finalize(() => (this.sending = false)))
      .subscribe({
        next: () => {
          this.sendSuccess = true;
          this.composeForm.reset();
          setTimeout(() => {
            this.sendSuccess = false;
            this.closeCompose();
            if (this.activeTab === 'sent') this.loadMessages();
          }, 1500);
        },
        error: (err) => {
          const msg = err?.error?.error;
          this.sendError = msg || 'Failed to send message. Check the recipient email.';
        },
      });
  }

  openMessage(msg: MessageDto): void {
    this.selectedMsg = msg;
    if (this.activeTab === 'inbox' && !msg.isRead) {
      this.messageService.markAsRead(msg.id).subscribe(() => {
        msg.isRead = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      });
    }
  }

  replyTo(msg: MessageDto): void {
    this.composeForm.patchValue({
      recipientEmail: msg.senderEmail,
      subject: msg.subject.startsWith('Re:') ? msg.subject : `Re: ${msg.subject}`,
      body: '',
    });
    this.sendError = null;
    this.sendSuccess = false;
    this.showCompose = true;
    this.selectedMsg = null;
  }

  private loadMessages(): void {
    this.loading = true;
    this.loadError = null;

    const obs$ = this.activeTab === 'inbox'
      ? this.messageService.getInbox()
      : this.messageService.getSent();

    obs$.pipe(finalize(() => (this.loading = false))).subscribe({
      next: (msgs) => {
        this.messages = msgs;
        if (this.activeTab === 'inbox') {
          this.unreadCount = msgs.filter((m) => !m.isRead).length;
        }
      },
      error: () => {
        this.loadError = 'Failed to load messages.';
      },
    });
  }
}
