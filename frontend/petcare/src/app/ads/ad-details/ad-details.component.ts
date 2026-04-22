import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import * as L from 'leaflet';

import { AdsService } from '../../core/services/ads.service';
import { AuthService } from '../../core/auth/auth.service';
import { Ad, AdServiceType } from '../../models/ad.models';
import { UserRole } from '../../models/auth.models';

@Component({
  selector: 'app-ad-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  styleUrl: './ad-details.component.css',
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
                    <div class="text-muted small">{{ serviceLabel(ad.serviceType) }}</div>
                  </div>
                </div>

                <hr />

                <p class="card-text mb-3" style="white-space: pre-wrap;">{{ ad.description }}</p>

                <div class="small text-muted">
                  Coordinates: {{ ad.latitude }} / {{ ad.longitude }}
                </div>

                <div class="mt-3 d-flex gap-2">
                  <button class="btn btn-primary" type="button"
                    *ngIf="!isOwner && role === 'Provider'"
                    (click)="sendMessage()">
                    Message owner
                  </button>

                  <a
                    class="btn btn-outline-primary"
                    *ngIf="isOwner && role === 'Seeker'"
                    [routerLink]="['/ads', ad.id, 'edit']"
                  >
                    Edit
                  </a>

                  <button class="btn btn-outline-danger" type="button" *ngIf="isOwner" (click)="deleteAd()">
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
/**
 * Ad details page.
 *
 * Loads a single advertisement by the `id` route parameter, renders its
 * information and shows a Leaflet map centered on the ad's location.
 * Contextual actions (Edit / Delete / Message owner) are shown based on
 * the current user's role and whether they own the ad.
 */
export class AdDetailsComponent implements OnInit, OnDestroy {
  private readonly adsService = inject(AdsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('mapEl', { static: false }) mapEl?: ElementRef<HTMLDivElement>;

  loading = false;
  apiError: string | null = null;
  ad: Ad | null = null;

  role: UserRole | null = null;
  isOwner = false;

  private currentUserId: string | null = null;

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
  private map?: any;
  private marker?: any;

  ngOnInit(): void {
    this.role = this.auth.getRole();
    this.currentUserId = this.auth.getUserId();
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

  /**
   * Fetches the advertisement, determines ownership, and renders the map
   * once Angular has flushed the DOM so the map container exists.
   */
  private load(id: string): void {
    this.loading = true;
    this.apiError = null;

    this.adsService
      .getAdById(id)
      .subscribe({
        next: (ad) => {
          this.ad = ad;
          this.loading = false;
          this.isOwner = !!this.currentUserId && ad.ownerId === this.currentUserId;
          if (ad.latitude != null && ad.longitude != null) {
            // detectChanges() synchronously flushes the *ngIf and populates @ViewChild
            // so mapEl is guaranteed to exist when renderMap() is called below.
            this.cdr.detectChanges();
            this.renderMap(ad.latitude!, ad.longitude!);
          }
        },
        error: () => {
          this.loading = false;
          this.apiError = 'Failed to load ad details.';
        },
      });
  }

  /** (Re-)creates a Leaflet map centered on the supplied coordinates. */
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

  /**
   * Prompts the user to confirm and then deletes the advertisement. Only
   * callable by the owner (guarded both here and by the template).
   */
  deleteAd(): void {
    if (!this.ad || !this.isOwner) return;

    const ok = confirm(`Delete ad "${this.ad.title}"?`);
    if (!ok) return;

    this.adsService.deleteAd(this.ad.id).subscribe({
      next: () => this.router.navigate(['/ads']),
      error: () => (this.apiError = 'Failed to delete ad.'),
    });
  }

  /**
   * Navigates to the inbox with query parameters that tell the inbox page
   * to open the "compose" drawer pre-filled with the ad owner's email.
   */
  sendMessage(): void {
    if (!this.ad) return;
    // Pass ownerEmail so InboxComponent can pre-fill the recipient field.
    this.router.navigate(['/inbox'], {
      queryParams: { compose: true, to: this.ad.ownerEmail ?? '' },
    });
  }
}

