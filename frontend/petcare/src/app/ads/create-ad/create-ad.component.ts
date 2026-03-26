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

@Component({
  selector: 'app-create-ad',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
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
            Click on the map to select location.
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

            <div class="mb-3">
              <label class="form-label">City</label>
              <input class="form-control" formControlName="city" />
              <div class="text-danger small" *ngIf="city.invalid && (city.dirty || city.touched)">
                City is required.
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
              <label class="form-label">Price</label>
              <input type="number" class="form-control" formControlName="price" min="0" step="0.01" />
              <div class="text-danger small" *ngIf="price.invalid && (price.dirty || price.touched)">
                Price is required and must be non-negative.
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label">Latitude</label>
              <input
                type="number"
                class="form-control"
                formControlName="latitude"
                step="0.000001"
              />
            </div>

            <div class="mb-3">
              <label class="form-label">Longitude</label>
              <input
                type="number"
                class="form-control"
                formControlName="longitude"
                step="0.000001"
              />
            </div>

            <div class="d-grid gap-2">
              <button class="btn btn-primary" type="submit" [disabled]="form.invalid || loading">
                {{ loading ? 'Creating...' : 'Create' }}
              </button>
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
    latitude: new FormControl<number | null>(null, { validators: [Validators.required] }),
    longitude: new FormControl<number | null>(null, { validators: [Validators.required] }),
  });

  get title() {
    return this.form.controls.title;
  }
  get description() {
    return this.form.controls.description;
  }
  get city() {
    return this.form.controls.city;
  }
  get price() {
    return this.form.controls.price;
  }

  ngAfterViewInit(): void {
    // Map init after view is ready
    this.initMap();
  }

  ngOnDestroy(): void {
    this.marker?.remove();
    this.map?.remove();
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

    this.map.on('click', (e: any) => this.onMapClick(e.latlng));
  }

  private onMapClick(latlng: any): void {
    const lat = Number(latlng.lat.toFixed(6));
    const lng = Number(latlng.lng.toFixed(6));

    this.form.patchValue({ latitude: lat, longitude: lng });

    if (this.marker) this.marker.remove();
    this.marker = L.marker([lat, lng]).addTo(this.map!);
  }

  onSubmit(): void {
    this.apiError = null;
    if (this.form.invalid) return;

    this.loading = true;

    const raw = this.form.getRawValue();
    const payload: CreateAdPayload = {
      title: raw.title,
      description: raw.description,
      serviceType: raw.serviceType,
      town: raw.city,
      xcordinates: raw.longitude != null ? String(raw.longitude) : undefined,
      ycordinates: raw.latitude != null ? String(raw.latitude) : undefined,
      price: raw.price,
      startDate: null,
      endDate: null,
    };

    // SeekerGuard should ensure role, but keep UI safe.
    if (this.auth.getRole() !== 'Seeker') {
      this.loading = false;
      this.apiError = 'Only Seeker users can create ads.';
      return;
    }

    this.adsService
      .createAd(payload)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => this.router.navigate(['/ads']),
        error: () => {
          this.apiError = 'Failed to create ad. Please try again.';
        },
      });
  }
}

