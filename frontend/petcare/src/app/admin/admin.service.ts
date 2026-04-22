import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';

import { environment } from '../../environments/environment';
import { AdminAdDto, AdminMessageDto, PagedResultDto } from './admin.models';

/**
 * HTTP client for the backend `Admin` controller. Every method calls an
 * admin-only endpoint, so callers must ensure the current user holds the
 * `Admin` role (typically through {@link adminGuard}).
 */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly apiBase = environment.apiBase;
  private readonly adminUrl = `${this.apiBase}/Admin`;

  constructor(private readonly http: HttpClient) {}

  /** Returns a page of every advertisement in the system for moderation. */
  getAds(page: number, pageSize: number): Observable<PagedResultDto<AdminAdDto>> {
    return this.http.get<PagedResultDto<AdminAdDto>>(`${this.adminUrl}/ads`, {
      params: { page: String(page), pageSize: String(pageSize) },
    }).pipe(timeout(8000));
  }

  /** Deletes an advertisement regardless of ownership. */
  deleteAd(id: string): Observable<unknown> {
    return this.http.delete(`${this.adminUrl}/ads/${encodeURIComponent(id)}`).pipe(timeout(8000));
  }

  /** Returns a page of every message in the system for moderation. */
  getMessages(page: number, pageSize: number): Observable<PagedResultDto<AdminMessageDto>> {
    return this.http.get<PagedResultDto<AdminMessageDto>>(`${this.adminUrl}/messages`, {
      params: { page: String(page), pageSize: String(pageSize) },
    }).pipe(timeout(8000));
  }

  /** Forces a message into the read state for moderation purposes. */
  markMessageRead(id: string): Observable<unknown> {
    return this.http.post(`${this.adminUrl}/messages/read/${encodeURIComponent(id)}`, {}).pipe(timeout(8000));
  }

  /** Permanently deletes a message from the system. */
  deleteMessage(id: string): Observable<unknown> {
    return this.http.delete(`${this.adminUrl}/messages/${encodeURIComponent(id)}`).pipe(timeout(8000));
  }
}

