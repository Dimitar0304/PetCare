import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, shareReplay, throwError, timeout } from 'rxjs';

import { WeatherAiResponseDto } from '../../models/weather.models';
import { environment } from '../../../environments/environment';

/**
 * HTTP client for the backend `WeatherAi` endpoint. Responses are cached in
 * memory for five minutes per `(city, daysAhead)` pair so revisiting a city
 * does not retrigger an external API call.
 */
@Injectable({ providedIn: 'root' })
export class WeatherAiService {
  private readonly apiBase = environment.apiBase;
  private readonly url = `${this.apiBase}/WeatherAi`;

  private static readonly TTL_MS = 5 * 60_000;

  private cache = new Map<string, { at: number; obs$: Observable<WeatherAiResponseDto> }>();

  constructor(private readonly http: HttpClient) {}

  /**
   * Returns the weather forecast for a city. The `forceRefresh` flag bypasses
   * the cache — useful for a user-initiated "refresh" action.
   */
  getWeatherAi(city: string, daysAhead = 4, forceRefresh = false): Observable<WeatherAiResponseDto> {
    const key = `${city.trim().toLowerCase()}::${daysAhead}`;
    const now = Date.now();
    const hit = this.cache.get(key);
    if (!forceRefresh && hit && now - hit.at < WeatherAiService.TTL_MS) {
      return hit.obs$;
    }

    const params = new HttpParams().set('city', city.trim()).set('daysAhead', String(daysAhead));

    const obs$ = this.http.get<WeatherAiResponseDto>(this.url, { params }).pipe(
      timeout(10000),
      catchError((err) => {
        this.cache.delete(key);
        return throwError(() => err);
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    this.cache.set(key, { at: now, obs$ });
    return obs$;
  }
}
