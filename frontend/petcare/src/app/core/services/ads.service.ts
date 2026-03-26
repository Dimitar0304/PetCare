import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, shareReplay, tap, timeout } from 'rxjs';

import { Ad, AdDto, AdServiceType, CreateAdPayload } from '../../models/ad.models';

@Injectable({ providedIn: 'root' })
export class AdsService {
  private readonly apiBase = 'https://localhost:5001/api';
  private readonly adsUrl = `${this.apiBase}/Ad`;

  constructor(private readonly http: HttpClient) {}

  private adsCache$?: Observable<Ad[]>;
  private adCache = new Map<string, Observable<Ad>>();

  getAds(forceRefresh = false): Observable<Ad[]> {
    if (!forceRefresh && this.adsCache$) return this.adsCache$;

    this.adsCache$ = this.http.get<AdDto[]>(`${this.adsUrl}/getAll`).pipe(
      timeout(8000),
      map((dtos) => dtos.map((dto) => this.mapToAd(dto)).filter(Boolean) as Ad[]),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    return this.adsCache$;
  }

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

  createAd(payload: CreateAdPayload): Observable<Ad> {
    return this.http.post<AdDto>(`${this.adsUrl}/create`, payload).pipe(
      timeout(8000),
      map((dto) => this.mapToAd(dto)!)
    );
  }

  deleteAd(id: string): Observable<unknown> {
    // Controller signature is `DeleteAdById(string id)` with default model binding.
    return this.http.post(`${this.adsUrl}/delete`, null, { params: { id } }).pipe(
      timeout(8000),
      tap(() => {
        // Invalidate caches
        this.adsCache$ = undefined;
        this.adCache.delete(id);
      })
    );
  }

  private mapToAd(dto: AdDto): Ad | null {
    const latitude = dto.ycordinates != null ? Number(dto.ycordinates) : undefined;
    const longitude = dto.xcordinates != null ? Number(dto.xcordinates) : undefined;

    // Basic guard: requirement expects lat/lng/city; if missing we won't show marker.
    if (!dto.town) return null;
    if (latitude == null || longitude == null || Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return null;
    }

    return {
      id: dto.id,
      title: dto.title,
      description: dto.description,
      serviceType: dto.serviceType as AdServiceType,
      city: dto.town,
      latitude,
      longitude,
      price: dto.price,
      startDate: dto.startDate ?? null,
      endDate: dto.endDate ?? null,
    };
  }
}

