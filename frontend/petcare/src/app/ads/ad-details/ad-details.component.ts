import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import * as L from 'leaflet';

import { AdsService } from '../../core/services/ads.service';
import { AuthService } from '../../core/auth/auth.service';
import { Ad } from '../../models/ad.models';

@Component({
  selector: 'app-ad-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container py-4">
      <div class="d-flex align-items-center justify-content-between mb-3">
        <div>
          <div class="text-muted small">Ad</div>
          <h2 class="mb-0">Details</h2>
        </div>
        <a class="btn btn-outline-secondary" routerLink="/">Back</a>
      </div>

      <div class="alert alert-danger" *ngIf="apiError">{{ apiError }}</div>

      <div *ngIf="loading" class="d-flex align-items-center gap-2 text-muted">
        <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
        Loading…
      </div>

      <div *ngIf="!loading && ad">
        <div class="row g-3">
          <div class="col-lg-8">
            <div class="card">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start gap-3">
                  <div>
                    <h3 class="card-title mb-1">{{ ad.title }}</h3>
                    <div class="text-muted">{{ ad.city }}</div>
                  </div>
                  <div class="text-end">
                    <div class="h5 mb-0">{{ ad.price }} BGN</div>
                    <div class="text-muted small">Type: {{ ad.serviceType }}</div>
                  </div>
                </div>

                <hr />

                <p class="card-text mb-3" style="white-space: pre-wrap;">{{ ad.description }}</p>

                <div class="small text-muted">
                  Coordinates: {{ ad.latitude }} / {{ ad.longitude }}
                </div>

                <div class="mt-3 d-flex gap-2">
                  <button class="btn btn-primary" type="button" *ngIf="role === 'Provider'" disabled>
                    Apply (coming soon)
                  </button>

                  <button class="btn btn-outline-danger" type="button" *ngIf="role === 'Seeker'" (click)="deleteAd()">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="col-lg-4">
            <div class="card">
              <div class="card-body">
                <div class="fw-semibold mb-2">Location</div>
                <div #mapEl class="border rounded" style="height: 320px;"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AdDetailsComponent implements OnInit, OnDestroy {
  private readonly adsService = inject(AdsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  @ViewChild('mapEl', { static: false }) mapEl?: ElementRef<HTMLDivElement>;

  loading = false;
  apiError: string | null = null;
  ad: Ad | null = null;

  role: 'Seeker' | 'Provider' | null = null;

  private map?: any;
  private marker?: any;

  ngOnInit(): void {
    this.role = this.auth.getRole();
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.apiError = 'Invalid ad id.';
      return;
    }
    this.load(id);
  }

  ngOnDestroy(): void {
    this.marker?.remove();
    this.map?.remove();
  }

  private load(id: string): void {
    this.loading = true;
    this.apiError = null;

    this.adsService
      .getAdById(id)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (ad) => {
          this.ad = ad;
          // Render map if we have coordinates.
          if (this.mapEl && ad.latitude != null && ad.longitude != null) {
            this.renderMap(ad.latitude, ad.longitude);
          }
        },
        error: () => {
          this.apiError = 'Failed to load ad details.';
        },
      });
  }

  private renderMap(lat: number, lng: number): void {
    if (!this.mapEl) return;

    this.marker?.remove();
    this.map?.remove();

    this.map = L.map(this.mapEl.nativeElement).setView([lat, lng], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(this.map);
    this.marker = L.marker([lat, lng]).addTo(this.map);
  }

  deleteAd(): void {
    if (!this.ad) return;
    if (this.role !== 'Seeker') return;

    const ok = confirm(`Delete ad "${this.ad.title}"?`);
    if (!ok) return;

    this.adsService.deleteAd(this.ad.id).subscribe({
      next: () => this.router.navigate(['/ads']),
      error: () => (this.apiError = 'Failed to delete ad.'),
    });
  }
}

