import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
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
import { Router, RouterModule } from '@angular/router';
import * as L from 'leaflet';
import { finalize } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { AdsService } from '../../core/services/ads.service';
import { AdServiceType, CreateAdPayload } from '../../models/ad.models';
import { BG_CITIES, BgCity } from '../../core/data/bg-cities';

// Coordinates are optional; the backend stores them as nullable strings.

@Component({
  selector: 'app-create-ad',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  styleUrl: './create-ad.component.css',
  template: `
    <div class="container py-4">
      <div class="d-flex align-items-center justify-content-between mb-3">
        <h2 class="mb-0">Create Ad</h2>
        <a class="btn btn-outline-secondary btn-sm" routerLink="/ads">Back to ads</a>
      </div>

      <div class="row g-3">
        <div class="col-lg-8">
          <div #mapEl class="border rounded" style="height: 540px;"></div>
          <div class="text-muted small mt-2">
            Click on the map or select a city to set the location.
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

            <!-- City autocomplete -->
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

              <div
                *ngIf="citySuggestions.length > 0"
                class="list-group position-absolute w-100 shadow"
                style="z-index: 1000; top: 100%; max-height: 220px; overflow-y: auto;"
              >
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
              <div class="col-12">
                <div class="text-danger small" *ngIf="(form.controls.latitude.invalid || form.controls.longitude.invalid) && form.touched">
                  Select a city or click the map to set coordinates.
                </div>
              </div>
            </div>

            <div class="d-grid gap-2">
              <button class="btn btn-primary" type="submit" [disabled]="loading">
                {{ loading ? 'Creating...' : 'Create Ad' }}
              </button>
            </div>

            <div class="alert alert-success mt-3" *ngIf="successMsg">
              {{ successMsg }}
            </div>
            <div class="alert alert-danger mt-3" *ngIf="apiError">
              {{ apiError }}
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class CreateAdComponent implements AfterViewInit, OnDestroy {
  private readonly adsService = inject(AdsService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  @ViewChild('mapEl', { static: true }) mapEl!: ElementRef<HTMLDivElement>;

  loading = false;
  apiError: string | null = null;
  successMsg: string | null = null;
  citySuggestions: BgCity[] = [];

  private map?: any;
  private marker?: any;

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
    // Coordinates are optional; user can click the map or pick a city from autocomplete.
    latitude: new FormControl<number | null>(null),
    longitude: new FormControl<number | null>(null),
  });

  get title() { return this.form.controls.title; }
  get description() { return this.form.controls.description; }
  get city() { return this.form.controls.city; }
  get price() { return this.form.controls.price; }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    this.marker?.remove();
    this.map?.remove();
  }

  onCityInput(): void {
    const val = this.form.controls.city.value.trim().toLowerCase();
    if (!val || val.length < 1) {
      this.citySuggestions = [];
      return;
    }
    this.citySuggestions = BG_CITIES
      .filter((c) => c.name.toLowerCase().startsWith(val))
      .slice(0, 8);
  }

  onCityBlur(): void {
    // Delay to let mousedown on suggestion fire first
    setTimeout(() => { this.citySuggestions = []; }, 150);
  }

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

  onSubmit(): void {
    this.form.markAllAsTouched();
    this.apiError = null;
    this.successMsg = null;

    if (this.form.invalid) return;

    if (this.auth.getRole() !== 'Seeker') {
      this.apiError = 'Only Seeker users can create ads.';
      return;
    }

    this.loading = true;
    const raw = this.form.getRawValue();
    const payload: CreateAdPayload = {
      title: raw.title,
      description: raw.description,
      // <select [value]> always returns a string; cast back to number for the backend.
      serviceType: Number(raw.serviceType) as AdServiceType,
      town: raw.city,
      xcordinates: raw.longitude != null ? String(raw.longitude) : undefined,
      ycordinates: raw.latitude != null ? String(raw.latitude) : undefined,
      price: raw.price,
      startDate: null,
      endDate: null,
    };

    this.adsService
      .createAd(payload)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.successMsg = 'Ad created! Redirecting…';
          setTimeout(() => this.router.navigate(['/ads'], { state: { justCreated: true } }), 800);
        },
        error: (err) => {
          const detail = err?.error?.errors ?? err?.error ?? null;
          this.apiError = detail
            ? `Failed to create ad: ${JSON.stringify(detail)}`
            : 'Failed to create ad. Please try again.';
        },
      });
  }
}
