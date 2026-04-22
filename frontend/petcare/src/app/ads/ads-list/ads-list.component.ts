import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import * as L from 'leaflet';
import { FormsModule } from '@angular/forms';

import { AdsService } from '../../core/services/ads.service';
import { AuthService } from '../../core/auth/auth.service';
import { UiPreferencesService } from '../../core/services/ui-preferences.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { Ad, AdServiceType } from '../../models/ad.models';
import { WeatherWidgetComponent } from '../../weather/weather-widget.component';

@Component({
  selector: 'app-ads-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TPipe, WeatherWidgetComponent],
  styleUrl: './ads-list.component.css',
  template: `
    <div class="py-4">
      <div class="mb-4">
        <app-weather-widget
          [defaultCity]="weatherCity"
          [daysAhead]="4"
          [compact]="(ui.prefs$ | async)?.simplified ?? false"
        ></app-weather-widget>
      </div>

      <div class="p-4 p-md-5 mb-4 rounded-3 bg-light border">
        <div class="container-fluid py-2">
          <h1 class="display-6 fw-semibold mb-2">{{ 'ads.title' | t }}</h1>
          <p class="text-muted mb-3">
            {{ 'ads.subtitle' | t }}
          </p>

          <div class="row g-2 align-items-center">
            <div class="col-md-5">
              <input
                class="form-control"
                [placeholder]="'ads.filterCity' | t"
                [(ngModel)]="cityFilter"
                (ngModelChange)="applyFilter()"
              />
            </div>
            <div class="col-md-auto">
              <button class="btn btn-outline-secondary" type="button" (click)="reload(true)" [disabled]="loading">
                {{ loading ? ('common.loading' | t) : ('common.refresh' | t) }}
              </button>
            </div>
            <div class="col-md-auto ms-md-auto">
              <button class="btn btn-outline-dark" type="button" (click)="ui.toggleSimplified()">
                {{ (ui.prefs$ | async)?.simplified ? ('common.standardView' | t) : ('common.simpleView' | t) }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-3">
        <div class="col-lg-8" [class.d-none]="(ui.prefs$ | async)?.simplified">
          <div #mapEl class="map-container"></div>
        </div>

        <div [class.col-lg-4]="!(ui.prefs$ | async)?.simplified" [class.col-12]="(ui.prefs$ | async)?.simplified">
          <div class="alert alert-danger" *ngIf="apiError">{{ apiError }}</div>
          <div *ngIf="loading" class="text-muted">Loading ads…</div>

          <div class="ads-scroll vstack gap-3" *ngIf="!loading && filteredAds.length > 0">
            <div class="card" *ngFor="let ad of filteredAds">
              <div class="card-body">
                <div class="d-flex justify-content-between gap-2">
                  <div>
                    <div class="fw-semibold">{{ ad.title }}</div>
                    <div class="text-muted small">{{ ad.city }}</div>
                  </div>
                  <div class="text-end">
                    <div class="fw-semibold">{{ ad.price }} BGN</div>
                    <div class="text-muted small">{{ serviceLabel(ad.serviceType) }}</div>
                  </div>
                </div>

                <div class="mt-2 d-flex gap-2">
                  <button class="btn btn-sm btn-primary" type="button" (click)="goToDetails(ad.id)">
                    View
                  </button>
                  <button
                    class="btn btn-sm btn-outline-danger"
                    type="button"
                    *ngIf="isOwner(ad)"
                    (click)="deleteAd(ad); $event.stopPropagation()"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-3 d-flex justify-content-between align-items-center" *ngIf="!loading && total > 0">
            <div class="text-muted small">
              Showing {{ ads.length }} of {{ total }}
            </div>
            <button
              class="btn btn-outline-primary btn-sm"
              type="button"
              (click)="loadMore()"
              [disabled]="loadingMore || ads.length >= total"
            >
              {{ ads.length >= total ? ('ads.noMore' | t) : (loadingMore ? ('common.loading' | t) : ('ads.loadMore' | t)) }}
            </button>
          </div>

          <div *ngIf="!loading && filteredAds.length === 0 && !apiError" class="text-muted">
            No ads available.
          </div>
        </div>
      </div>
    </div>
  `,
})
/**
 * Landing page that lists advertisements side-by-side with a Bulgaria-centered
 * Leaflet map. Provides client-side city filtering, paged loading, and
 * integrates the weather widget. The "simplified" UI preference hides the
 * map and renders a denser list instead.
 */
export class AdsListComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly adsService = inject(AdsService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  readonly ui = inject(UiPreferencesService);

  @ViewChild('mapEl', { static: true }) mapEl!: ElementRef<HTMLDivElement>;

  ads: Ad[] = [];
  filteredAds: Ad[] = [];
  loading = false;
  loadingMore = false;
  apiError: string | null = null;
  cityFilter = '';
  weatherCity = 'Sofia';
  total = 0;

  private page = 1;
  private readonly pageSize = 20;

  private readonly serviceLabels: Record<AdServiceType, string> = {
    1: 'Dog Walking',
    2: 'Feeding Animal',
    3: 'Overnight Care',
    4: 'Pet Sitting',
    5: 'Something Specific',
  };

  /** Returns the human-readable label for a given service-type code. */
  serviceLabel(type: AdServiceType): string {
    return this.serviceLabels[type] ?? `Type ${type}`;
  }

  private currentUserId: string | null = null;
  private map?: any;
  private markers: any[] = [];

  ngOnInit(): void {
    this.currentUserId = this.auth.getUserId();
    // Force-refresh when navigating back from the create-ad form.
    const forceRefresh = (history.state as { justCreated?: boolean })?.justCreated === true;
    this.loadFirstPage(forceRefresh);
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    this.markers.forEach((m) => m.remove());
    this.markers = [];
    this.map?.remove();
  }

  /** Reloads the first page, optionally bypassing the cache. */
  reload(force = false): void {
    this.loadFirstPage(force);
  }

  /** Returns true when the current user owns the supplied advertisement. */
  isOwner(ad: Ad): boolean {
    return !!this.currentUserId && ad.ownerId === this.currentUserId;
  }

  /** Initializes a Leaflet map fitted to Bulgaria's bounding box. */
  private initMap(): void {
    const boundsBulgaria: [[number, number], [number, number]] = [
      [41.18, 20.1],
      [44.21, 28.6],
    ];

    this.map = L.map(this.mapEl.nativeElement).setView([42.6977, 23.3219], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(this.map);

    this.map.fitBounds(boundsBulgaria);
  }

  /** Requests the first page of ads, resets pagination, and renders markers. */
  private loadFirstPage(force = false): void {
    this.loading = true;
    this.apiError = null;
    this.page = 1;

    this.adsService
      .getAdsPage(this.page, this.pageSize, force)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.total = res.total;
          this.ads = res.items;
          this.applyFilter();
          this.renderMarkers();
        },
        error: () => {
          this.apiError = 'Failed to load ads.';
          this.markers.forEach((m) => m.remove());
          this.markers = [];
        },
      });
  }

  /** Requests the next page and appends it to the already-loaded list. */
  loadMore(): void {
    if (this.loadingMore || this.loading || this.ads.length >= this.total) return;

    this.loadingMore = true;
    const nextPage = this.page + 1;
    this.adsService
      .getAdsPage(nextPage, this.pageSize)
      .pipe(finalize(() => (this.loadingMore = false)))
      .subscribe({
        next: (res) => {
          this.page = nextPage;
          this.total = res.total;
          this.ads = [...this.ads, ...res.items];
          this.applyFilter();
          this.renderMarkers();
        },
        error: () => {
          this.apiError = 'Failed to load more ads.';
        },
      });
  }

  /** Recomputes `filteredAds` from the current city filter. */
  applyFilter(): void {
    const q = this.cityFilter.trim().toLowerCase();
    this.filteredAds = !q ? this.ads : this.ads.filter((a) => a.city.toLowerCase().includes(q));
  }

  /** Removes all existing markers and renders one marker per geocoded ad. */
  private renderMarkers(): void {
    if (!this.map) return;

    this.markers.forEach((m) => m.remove());
    this.markers = [];

    for (const ad of this.ads) {
      if (ad.latitude == null || ad.longitude == null) continue;

      const marker = L.marker([ad.latitude, ad.longitude]).addTo(this.map);
      marker.on('click', () => this.goToDetails(ad.id));
      this.markers.push(marker);
    }
  }

  /** Navigates to the ad detail page. */
  goToDetails(id: string): void {
    this.router.navigate(['/ads', id]);
  }

  /** Prompts for confirmation and deletes an ad if the current user owns it. */
  deleteAd(ad: Ad): void {
    if (!this.isOwner(ad)) return;
    const ok = confirm(`Delete ad "${ad.title}"?`);
    if (!ok) return;

    this.adsService.deleteAd(ad.id).subscribe({
      next: () => this.loadFirstPage(true),
      error: () => (this.apiError = 'Failed to delete ad.'),
    });
  }
}
