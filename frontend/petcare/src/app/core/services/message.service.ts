import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, timeout } from 'rxjs';

import { MessageDto, SendMessagePayload } from '../../models/message.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MessageService {
  private readonly apiBase = `${environment.apiBase}/Message`;

  readonly unreadCount$ = new BehaviorSubject<number>(0);

  constructor(private readonly http: HttpClient) {}

  getInbox(): Observable<MessageDto[]> {
    return this.http.get<MessageDto[]>(`${this.apiBase}/inbox`).pipe(
      timeout(8000),
      tap((msgs) => {
        const unread = msgs.filter((m) => !m.isRead).length;
        this.unreadCount$.next(unread);
      })
    );
  }

  getSent(): Observable<MessageDto[]> {
    return this.http.get<MessageDto[]>(`${this.apiBase}/sent`).pipe(timeout(8000));
  }

  sendMessage(payload: SendMessagePayload): Observable<MessageDto> {
    return this.http.post<MessageDto>(`${this.apiBase}/send`, payload).pipe(timeout(8000));
  }

  markAsRead(id: string): Observable<unknown> {
    return this.http.post(`${this.apiBase}/read/${id}`, null).pipe(
      timeout(5000),
      tap(() => {
        const current = this.unreadCount$.value;
        if (current > 0) this.unreadCount$.next(current - 1);
      })
    );
  }

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
