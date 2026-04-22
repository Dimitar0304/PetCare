import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, shareReplay, tap, throwError, timeout } from 'rxjs';

import { Ad, AdDto, AdServiceType, CreateAdPayload, PagedResultDto } from '../../models/ad.models';
import { environment } from '../../../environments/environment';

/**
 * HTTP client for the backend `Ad` controller.
 *
 * Implements a short-lived in-memory cache for list + detail requests so the
 * ads list, list pagination, and detail navigation feel instantaneous while
 * still invalidating on mutation.
 */
@Injectable({ providedIn: 'root' })
export class AdsService {
  private readonly apiBase = environment.apiBase;
  private readonly adsUrl = `${this.apiBase}/Ad`;

  constructor(private readonly http: HttpClient) {}

  /** Cache lifetime for ads list pages. */
  private static readonly ADS_CACHE_TTL_MS = 60_000;

  private adsCache$ = new Map<string, { createdAtMs: number; obs$: Observable<PagedResultDto<Ad>> }>();
  private adCache = new Map<string, Observable<Ad>>();

  /**
   * Returns a page of advertisements, cached by `page:pageSize` for 60 seconds.
   * Pass `forceRefresh = true` to skip the cache (for example after creating a
   * new ad so the listing reflects the change immediately).
   */
  getAdsPage(page: number, pageSize: number, forceRefresh = false): Observable<PagedResultDto<Ad>> {
    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : 20;

    const cacheKey = `${safePage}:${safePageSize}`;
    const now = Date.now();
    const cached = this.adsCache$.get(cacheKey);
    if (!forceRefresh && cached && now - cached.createdAtMs < AdsService.ADS_CACHE_TTL_MS) {
      return cached.obs$;
    }

    const obs$ = this.http
      .get<PagedResultDto<AdDto>>(`${this.adsUrl}/getAll`, {
        params: { page: String(safePage), pageSize: String(safePageSize) },
      })
      .pipe(
      timeout(8000),
      map((res) => ({
        ...res,
        items: res.items.map((dto) => this.mapToAd(dto)).filter(Boolean) as Ad[],
      })),
      catchError((err) => {
        this.adsCache$.delete(cacheKey);
        return throwError(() => err);
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    this.adsCache$.set(cacheKey, { createdAtMs: now, obs$ });
    return obs$;
  }

  /**
   * Fetches a single advertisement by id. Subsequent calls with the same id
   * return the cached observable until the ad is mutated or deleted.
   */
  getAdById(id: string): Observable<Ad> {
    const cached = this.adCache.get(id);
    if (cached) return cached;

    const req$ = this.http.get<AdDto>(`${this.adsUrl}/getById`, { params: { id } }).pipe(
      timeout(8000),
      map((dto) => this.mapToAd(dto)!),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    this.adCache.set(id, req$);
    return req$;
  }

  /**
   * Creates a new advertisement. On success the list-page cache is cleared so
   * every cached page reflects the new item on next read.
   */
  createAd(payload: CreateAdPayload): Observable<Ad> {
    return this.http.post<AdDto>(`${this.adsUrl}/create`, payload).pipe(
      timeout(8000),
      map((dto) => {
        this.adsCache$.clear();
        return this.mapToAd(dto)!;
      })
    );
  }

  /**
   * Deletes an advertisement. The controller uses default model binding with
   * a query-string id rather than a request body, hence the `POST` with
   * `null` body and `params`.
   */
  deleteAd(id: string): Observable<unknown> {
    // Controller signature is `DeleteAdById(string id)` with default model binding.
    return this.http.post(`${this.adsUrl}/delete`, null, { params: { id } }).pipe(
      timeout(8000),
      tap(() => {
        // Invalidate caches
        this.adsCache$.clear();
        this.adCache.delete(id);
      })
    );
  }

  /** Updates an advertisement and invalidates the list and detail caches. */
  updateAd(id: string, payload: CreateAdPayload): Observable<Ad> {
    return this.http.put<AdDto>(`${this.adsUrl}/update/${encodeURIComponent(id)}`, payload).pipe(
      timeout(8000),
      map((dto) => {
        // Invalidate caches
        this.adsCache$.clear();
        this.adCache.delete(id);
        return this.mapToAd(dto)!;
      })
    );
  }

  /**
   * Translates the raw backend DTO to the frontend model: renames `town` to
   * `city` and parses string coordinates to numbers, dropping malformed
   * coordinate values instead of propagating NaN.
   */
  private mapToAd(dto: AdDto): Ad | null {
    if (!dto.id || !dto.town) return null;

    const latitude = dto.ycordinates != null ? Number(dto.ycordinates) : undefined;
    const longitude = dto.xcordinates != null ? Number(dto.xcordinates) : undefined;

    return {
      id: dto.id,
      ownerId: dto.ownerId,
      ownerEmail: dto.ownerEmail,
      title: dto.title,
      description: dto.description,
      serviceType: dto.serviceType as AdServiceType,
      city: dto.town,
      latitude: latitude != null && !Number.isNaN(latitude) ? latitude : undefined,
      longitude: longitude != null && !Number.isNaN(longitude) ? longitude : undefined,
      price: dto.price,
      startDate: dto.startDate ?? null,
      endDate: dto.endDate ?? null,
    };
  }
}

