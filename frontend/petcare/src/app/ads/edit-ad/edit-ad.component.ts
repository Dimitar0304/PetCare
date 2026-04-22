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
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import * as L from 'leaflet';
import { finalize } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { AdsService } from '../../core/services/ads.service';
import { Ad, AdServiceType, CreateAdPayload } from '../../models/ad.models';
import { BG_CITIES, BgCity } from '../../core/data/bg-cities';

@Component({
  selector: 'app-edit-ad',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  styleUrl: './edit-ad.component.css',
  template: `
    <div class="container py-4">
      <div class="d-flex align-items-center justify-content-between mb-3">
        <h2 class="mb-0">Edit Ad</h2>
        <a class="btn btn-outline-secondary btn-sm" routerLink="/ads">Back to ads</a>
      </div>

      <div class="alert alert-danger" *ngIf="apiError">{{ apiError }}</div>

      <div *ngIf="loading && !ad" class="d-flex align-items-center gap-2 text-muted">
        <span class="spinner-border spinner-border-sm"></span> Loading…
      </div>

      <div class="row g-3" *ngIf="ad">
        <div class="col-lg-8">
          <div #mapEl class="map-container"></div>
          <div class="text-muted small mt-2">
            Click on the map or select a city to change the location.
          </div>
        </div>

        <div class="col-lg-4">
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="mb-3">
              <label class="form-label">Title</label>
              <input class="form-control" formControlName="title" />
              <div class="text-danger small" *ngIf="title.invalid && (title.dirty || title.touched)">
                Title is required.
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label">Description</label>
              <textarea class="form-control" rows="4" formControlName="description"></textarea>
              <div class="text-danger small" *ngIf="description.invalid && (description.dirty || description.touched)">
                Description is required.
              </div>
            </div>

            <div class="mb-3 position-relative">
              <label class="form-label">City</label>
              <input
                class="form-control"
                formControlName="city"
                autocomplete="off"
                (input)="onCityInput()"
                (blur)="onCityBlur()"
                placeholder="Start typing a city..."
              />
              <div class="text-danger small" *ngIf="city.invalid && (city.dirty || city.touched)">
                City is required.
              </div>

              <div *ngIf="citySuggestions.length > 0" class="city-dropdown list-group">
                <button
                  class="list-group-item list-group-item-action py-2"
                  type="button"
                  *ngFor="let c of citySuggestions"
                  (mousedown)="selectCity(c)"
                >
                  {{ c.name }}
                </button>
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label">Service type</label>
              <select class="form-select" formControlName="serviceType">
                <option *ngFor="let opt of serviceTypeOptions" [value]="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>

            <div class="mb-3">
              <label class="form-label">Price (BGN)</label>
              <input type="number" class="form-control" formControlName="price" min="0" step="0.01" />
              <div class="text-danger small" *ngIf="price.invalid && (price.dirty || price.touched)">
                Price is required and must be non-negative.
              </div>
            </div>

            <div class="row g-2 mb-3">
              <div class="col-6">
                <label class="form-label">Latitude</label>
                <input type="number" class="form-control form-control-sm" formControlName="latitude" step="0.000001" readonly />
              </div>
              <div class="col-6">
                <label class="form-label">Longitude</label>
                <input type="number" class="form-control form-control-sm" formControlName="longitude" step="0.000001" readonly />
              </div>
            </div>

            <div class="d-grid gap-2">
              <button class="btn btn-primary" type="submit" [disabled]="loading">
                {{ loading ? 'Saving...' : 'Save changes' }}
              </button>
            </div>

            <div class="alert alert-success mt-3" *ngIf="successMsg">
              {{ successMsg }}
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
})
/**
 * Edit-ad form. Loads an ad by the `id` route parameter, verifies that the
 * current user owns it (redirecting otherwise) and then exposes the same
 * city-autocomplete + map interaction as {@link CreateAdComponent}.
 */
export class EditAdComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly adsService = inject(AdsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);

  @ViewChild('mapEl', { static: true }) mapEl!: ElementRef<HTMLDivElement>;

  ad: Ad | null = null;
  loading = false;
  apiError: string | null = null;
  successMsg: string | null = null;
  citySuggestions: BgCity[] = [];

  private map?: any;
  private marker?: any;
  private adId: string | null = null;

  serviceTypeOptions: Array<{ value: AdServiceType; label: string }> = [
    { value: 1, label: 'Dog Walking' },
    { value: 2, label: 'Feeding Animal' },
    { value: 3, label: 'Overnight Care' },
    { value: 4, label: 'Pet Sitting' },
    { value: 5, label: 'Something Specific' },
  ];

  form = new FormGroup({
    title: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    city: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    serviceType: new FormControl<AdServiceType>(1, { nonNullable: true, validators: [Validators.required] }),
    price: new FormControl<number>(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    latitude: new FormControl<number | null>(null),
    longitude: new FormControl<number | null>(null),
  });

  get title() { return this.form.controls.title; }
  get description() { return this.form.controls.description; }
  get city() { return this.form.controls.city; }
  get price() { return this.form.controls.price; }

  ngOnInit(): void {
    this.adId = this.route.snapshot.paramMap.get('id');
    if (!this.adId) {
      this.apiError = 'Invalid ad id.';
      return;
    }

    this.loading = true;
    this.adsService
      .getAdById(this.adId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (ad) => {
          const userId = this.auth.getUserId();
          if (!userId || ad.ownerId !== userId) {
            this.apiError = 'You can only edit your own ads.';
            setTimeout(() => this.router.navigate(['/ads', ad.id]), 600);
            return;
          }

          this.ad = ad;
          this.form.patchValue({
            title: ad.title,
            description: ad.description,
            city: ad.city,
            serviceType: ad.serviceType,
            price: ad.price,
            latitude: ad.latitude ?? null,
            longitude: ad.longitude ?? null,
          });

          if (ad.latitude != null && ad.longitude != null) {
            this.placeMarker(ad.latitude, ad.longitude, true);
          }
        },
        error: () => {
          this.apiError = 'Failed to load ad.';
        },
      });
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    this.marker?.remove();
    this.map?.remove();
  }

  /** Updates the city suggestion list based on the current input value. */
  onCityInput(): void {
    const val = this.form.controls.city.value.trim().toLowerCase();
    if (!val || val.length < 1) {
      this.citySuggestions = [];
      return;
    }
    this.citySuggestions = BG_CITIES.filter((c) => c.name.toLowerCase().startsWith(val)).slice(0, 8);
  }

  /** Hides the suggestion dropdown after a short delay to allow selection. */
  onCityBlur(): void {
    setTimeout(() => { this.citySuggestions = []; }, 150);
  }

  /** Applies the selected suggestion to the form and centers the map. */
  selectCity(city: BgCity): void {
    this.form.patchValue({
      city: city.name,
      latitude: city.lat,
      longitude: city.lng,
    });
    this.citySuggestions = [];
    this.placeMarker(city.lat, city.lng, true);
  }

  private initMap(): void {
    const boundsBulgaria: [[number, number], [number, number]] = [
      [41.18, 20.1],
      [44.21, 28.6],
    ];

    this.map = L.map(this.mapEl.nativeElement);
    this.map.fitBounds(boundsBulgaria);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(this.map);

    this.map.on('click', (e: any) => {
      const lat = Number(e.latlng.lat.toFixed(6));
      const lng = Number(e.latlng.lng.toFixed(6));
      this.form.patchValue({ latitude: lat, longitude: lng });
      this.placeMarker(lat, lng, false);
    });
  }

  private placeMarker(lat: number, lng: number, pan: boolean): void {
    if (this.marker) this.marker.remove();
    this.marker = L.marker([lat, lng]).addTo(this.map!);
    if (pan) this.map?.setView([lat, lng], 12);
  }

  /**
   * Validates the form and submits the changes. On success the user is
   * redirected back to the ad detail page.
   */
  onSubmit(): void {
    this.form.markAllAsTouched();
    this.apiError = null;
    this.successMsg = null;

    if (!this.adId || this.form.invalid) return;

    this.loading = true;
    const raw = this.form.getRawValue();
    const payload: CreateAdPayload = {
      title: raw.title,
      description: raw.description,
      serviceType: Number(raw.serviceType) as AdServiceType,
      town: raw.city,
      xcordinates: raw.longitude != null ? String(raw.longitude) : undefined,
      ycordinates: raw.latitude != null ? String(raw.latitude) : undefined,
      price: raw.price,
      startDate: null,
      endDate: null,
    };

    this.adsService
      .updateAd(this.adId, payload)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.successMsg = 'Saved! Redirecting…';
          setTimeout(() => this.router.navigate(['/ads', this.adId]), 700);
        },
        error: (err) => {
          const msg = err?.error?.error ?? null;
          this.apiError = msg || 'Failed to save changes.';
        },
      });
  }
}

