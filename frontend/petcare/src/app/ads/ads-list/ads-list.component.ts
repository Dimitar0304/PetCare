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
import { Ad } from '../../models/ad.models';

@Component({
  selector: 'app-ads-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="py-4">
      <div class="p-4 p-md-5 mb-4 rounded-3 bg-light border">
        <div class="container-fluid py-2">
          <h1 class="display-6 fw-semibold mb-2">Find trusted pet care in Bulgaria</h1>
          <p class="text-muted mb-3">
            Browse ads on the map, open details, and (if you are a Seeker) create your own ad.
          </p>

          <div class="row g-2 align-items-center">
            <div class="col-md-5">
              <input
                class="form-control"
                placeholder="Filter by city (e.g. Sofia)"
                [(ngModel)]="cityFilter"
              />
            </div>
            <div class="col-md-auto">
              <button class="btn btn-outline-secondary" type="button" (click)="reload(true)" [disabled]="loading">
                {{ loading ? 'Loading…' : 'Refresh' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-3">
        <div class="col-lg-8">
          <div #mapEl class="border rounded" style="height: 540px;"></div>
        </div>

        <div class="col-lg-4">
          <div class="alert alert-danger" *ngIf="apiError">{{ apiError }}</div>
          <div *ngIf="loading" class="text-muted">Loading ads…</div>

          <div class="vstack gap-3" *ngIf="!loading && filteredAds.length > 0">
            <div class="card" *ngFor="let ad of filteredAds">
              <div class="card-body">
                <div class="d-flex justify-content-between gap-2">
                  <div>
                    <div class="fw-semibold">{{ ad.title }}</div>
                    <div class="text-muted small">{{ ad.city }}</div>
                  </div>
                  <div class="text-end">
                    <div class="fw-semibold">{{ ad.price }} BGN</div>
                    <div class="text-muted small">Type: {{ ad.serviceType }}</div>
                  </div>
                </div>

                <div class="mt-2 d-flex gap-2">
                  <button class="btn btn-sm btn-primary" type="button" (click)="goToDetails(ad.id)">
                    View
                  </button>
                  <button
                    class="btn btn-sm btn-outline-danger"
                    type="button"
                    *ngIf="role === 'Seeker'"
                    (click)="deleteAd(ad); $event.stopPropagation()"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="!loading && ads.length === 0" class="text-muted">
            No ads available.
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AdsListComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly adsService = inject(AdsService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  @ViewChild('mapEl', { static: true }) mapEl!: ElementRef<HTMLDivElement>;

  ads: Ad[] = [];
  filteredAds: Ad[] = [];
  loading = false;
  apiError: string | null = null;
  role: 'Seeker' | 'Provider' | null = null;
  cityFilter = '';

  private map?: any;
  private markers: any[] = [];

  ngOnInit(): void {
    this.role = this.auth.getRole();
    this.loadAds();
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    this.markers.forEach((m) => m.remove());
    this.markers = [];
    this.map?.remove();
  }

  reload(force = false): void {
    this.loadAds(force);
  }

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

  private loadAds(force = false): void {
    this.loading = true;
    this.apiError = null;

    this.adsService
      .getAds(force)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (ads) => {
          this.ads = ads;
          this.applyFilter();
          this.renderMarkers();
        },
        error: (err) => {
          this.apiError = 'Failed to load ads.';
          // Keep state, but remove stale markers.
          this.markers.forEach((m) => m.remove());
          this.markers = [];
        },
      });
  }

  ngDoCheck(): void {
    // Cheap filter recalculation for better UX
    this.applyFilter();
  }

  private applyFilter(): void {
    const q = this.cityFilter.trim().toLowerCase();
    this.filteredAds = !q ? this.ads : this.ads.filter((a) => a.city.toLowerCase().includes(q));
  }

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

  goToDetails(id: string): void {
    this.router.navigate(['/ads', id]);
  }

  deleteAd(ad: Ad): void {
    if (this.role !== 'Seeker') return;
    const ok = confirm(`Delete ad "${ad.title}"?`);
    if (!ok) return;

    this.adsService.deleteAd(ad.id).subscribe({
      next: () => this.loadAds(),
      error: () => (this.apiError = 'Failed to delete ad.'),
    });
  }
}

