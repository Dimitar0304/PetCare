import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, timeout } from 'rxjs';

import { MessageDto, SendMessagePayload } from '../../models/message.models';
import { environment } from '../../../environments/environment';

/**
 * HTTP client for the backend `Message` controller. Maintains a reactive
 * `unreadCount$` observable that UI components (such as the navbar badge)
 * can subscribe to.
 */
@Injectable({ providedIn: 'root' })
export class MessageService {
  private readonly apiBase = `${environment.apiBase}/Message`;

  /** Reactive unread-messages counter, updated as the inbox is loaded and read. */
  readonly unreadCount$ = new BehaviorSubject<number>(0);

  constructor(private readonly http: HttpClient) {}

  /** Fetches the inbox and refreshes the unread count side-effectfully. */
  getInbox(): Observable<MessageDto[]> {
    return this.http.get<MessageDto[]>(`${this.apiBase}/inbox`).pipe(
      timeout(8000),
      tap((msgs) => {
        const unread = msgs.filter((m) => !m.isRead).length;
        this.unreadCount$.next(unread);
      })
    );
  }

  /** Fetches the sent-messages list. */
  getSent(): Observable<MessageDto[]> {
    return this.http.get<MessageDto[]>(`${this.apiBase}/sent`).pipe(timeout(8000));
  }

  /** Sends a new message to the recipient identified by email. */
  sendMessage(payload: SendMessagePayload): Observable<MessageDto> {
    return this.http.post<MessageDto>(`${this.apiBase}/send`, payload).pipe(timeout(8000));
  }

  /**
   * Marks a message as read. Also decrements the local unread counter to keep
   * the UI in sync without a round-trip.
   */
  markAsRead(id: string): Observable<unknown> {
    return this.http.post(`${this.apiBase}/read/${id}`, null).pipe(
      timeout(5000),
      tap(() => {
        const current = this.unreadCount$.value;
        if (current > 0) this.unreadCount$.next(current - 1);
      })
    );
  }

  /**
   * Refreshes the unread counter by calling the backend endpoint.
   * Errors are intentionally swallowed because a stale badge is preferable to
   * a failing component.
   */
  loadUnreadCount(): void {
    this.http
      .get<{ count: number }>(`${this.apiBase}/unread-count`)
      .pipe(timeout(5000))
      .subscribe({
        next: (res) => this.unreadCount$.next(res.count),
        error: () => {},
      });
  }
}
