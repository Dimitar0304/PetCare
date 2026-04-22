import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { Chart, ChartConfiguration, registerables } from 'chart.js';

import { WeatherAiService } from '../core/services/weather-ai.service';
import { WeatherAiResponseDto } from '../models/weather.models';
import { BG_CITIES } from '../core/data/bg-cities';

Chart.register(...registerables);

type ThemeName = 'default' | 'hot' | 'cold' | 'rainy';

@Component({
  selector: 'app-weather-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./weather-widget.component.css'],
  template: `
    <div class="weather-card" [ngClass]="theme">
      <div class="inner">
        <div class="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
          <div>
            <p class="city-sub mb-1">AI Weather Agent</p>
            <h3 class="city-title">{{ data?.city || defaultCity }}</h3>
          </div>

          <div class="d-flex flex-wrap gap-2">
            <span class="confidence-badge" *ngIf="data">
              🌡️ Temp {{ (data.confidence.temp * 100) | number: '1.0-0' }}%
            </span>
            <span class="confidence-badge" *ngIf="data">
              🌧️ Rain {{ (data.confidence.rainProb * 100) | number: '1.0-0' }}%
            </span>
          </div>
        </div>

        <div class="row g-2 align-items-center mb-3">
          <div class="col-12 col-sm-7 col-md-8">
            <input
              class="form-control form-ghost"
              list="weatherBgCities"
              [(ngModel)]="cityInput"
              (keyup.enter)="onSubmit()"
              name="weatherCity"
              placeholder="Enter a city (e.g. Sofia, Plovdiv, Varna)"
              autocomplete="off"
            />
            <datalist id="weatherBgCities">
              <option *ngFor="let c of bgCities" [value]="c.name"></option>
            </datalist>
          </div>
          <div class="col-12 col-sm-5 col-md-4 d-grid">
            <button class="btn btn-ghost" type="button" (click)="onSubmit()" [disabled]="loading || !cityInput.trim()">
              {{ loading ? 'Analyzing…' : 'Fetch + Predict' }}
            </button>
          </div>
        </div>

        <div class="error-banner mb-3" *ngIf="error">{{ error }}</div>

        <div class="demo-banner mb-3" *ngIf="data?.source === 'demo'">
          <span class="me-1">🧪</span>
          <strong>Demo mode.</strong>
          Set <code>OPENWEATHER_API_KEY</code> in your <code>.env</code> (next to
          <code>docker-compose.yml</code>) and rebuild to see live weather.
        </div>

        <ng-container *ngIf="loading && !data">
          <div class="skeleton-line mb-2" style="height: 64px"></div>
          <div class="skeleton-line mb-2" style="height: 180px"></div>
          <div class="skeleton-line" style="height: 60px"></div>
        </ng-container>

        <ng-container *ngIf="data as d">
          <div class="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-3">
            <div>
              <div class="temp-hero">
                {{ currentTemp | number: '1.0-0' }}<span class="temp-unit">°C</span>
              </div>
              <div class="city-sub">
                {{ weatherLabel }} · Generated {{ d.generatedAt | date: 'shortTime' }}
              </div>
            </div>
          </div>

          <div class="chart-panel mb-3">
            <div class="chart-title">Temperature trend (°C)</div>
            <div>
              <span class="chart-legend" style="color:#2563eb">
                <span class="dot"></span> Real
              </span>
              <span class="chart-legend dashed" style="color:#2563eb">
                <span class="dot"></span> AI predicted
              </span>
            </div>
            <div style="height: 180px; position: relative">
              <canvas #tempCanvas></canvas>
            </div>
          </div>

          <div class="chart-panel mb-3" *ngIf="!compact">
            <div class="chart-title">Rain probability (%)</div>
            <div>
              <span class="chart-legend" style="color:#16a34a">
                <span class="dot"></span> Real
              </span>
              <span class="chart-legend dashed" style="color:#16a34a">
                <span class="dot"></span> AI predicted
              </span>
            </div>
            <div style="height: 180px; position: relative">
              <canvas #rainCanvas></canvas>
            </div>
          </div>

          <div class="days-strip">
            <div
              class="day-chip"
              *ngFor="let p of d.merged"
              [class.predicted]="p.kind === 'predicted'"
              [title]="p.kind === 'predicted' ? 'AI predicted' : 'Real forecast'"
            >
              <div class="d-label">{{ p.date | date: 'E d MMM' }}</div>
              <div class="d-temp">{{ p.tempC | number: '1.0-0' }}°</div>
              <div class="d-rain">💧 {{ (p.rainProb * 100) | number: '1.0-0' }}%</div>
            </div>
          </div>

          <div class="city-sub mt-2" style="font-size: 0.7rem">
            {{ d.confidence.notes }}
          </div>
        </ng-container>
      </div>
    </div>
  `,
})
/**
 * Reusable AI weather widget.
 *
 * Fetches combined real + predicted forecast from {@link WeatherAiService}
 * and renders two Chart.js line charts (temperature and rain probability)
 * where solid segments are real data and dashed segments are AI predictions.
 * The card's visual theme adapts to the current conditions (hot / cold / rainy).
 */
export class WeatherWidgetComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  private readonly service = inject(WeatherAiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  @Input() defaultCity = 'Sofia';
  @Input() daysAhead = 4;
  @Input() compact = false;
  @Input() autoFetch = true;

  @ViewChild('tempCanvas') tempCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('rainCanvas') rainCanvas?: ElementRef<HTMLCanvasElement>;

  readonly bgCities = BG_CITIES;

  cityInput = '';
  loading = false;
  error: string | null = null;
  data: WeatherAiResponseDto | null = null;

  private tempChart?: Chart<'line'>;
  private rainChart?: Chart<'line'>;

  /**
   * Derives a visual theme from the current weather: `rainy` when any of the
   * next three days has >= 55% rain probability, otherwise `hot`/`cold` based
   * on the current temperature, falling back to `default`.
   */
  get theme(): ThemeName {
    if (!this.data) return 'default';
    const temp = this.currentTemp;
    const nextRain = Math.max(
      ...this.data.merged.slice(0, 3).map((p) => p.rainProb)
    );
    if (nextRain >= 0.55) return 'rainy';
    if (temp >= 26) return 'hot';
    if (temp <= 5) return 'cold';
    return 'default';
  }

  /** Current temperature in Celsius (first real data point), or 0 when no data. */
  get currentTemp(): number {
    if (!this.data || this.data.real.length === 0) return 0;
    return this.data.real[0].tempC;
  }

  /** Human-readable one-line description of the current conditions. */
  get weatherLabel(): string {
    if (!this.data) return '';
    const rain = this.data.real[0]?.rainProb ?? 0;
    if (rain >= 0.6) return 'Rainy';
    if (rain >= 0.3) return 'Showers possible';
    if (this.currentTemp >= 26) return 'Warm & clear';
    if (this.currentTemp <= 5) return 'Cold';
    return 'Mild';
  }

  ngOnInit(): void {
    this.cityInput = this.defaultCity;
    if (this.autoFetch) {
      this.fetch(this.cityInput);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['defaultCity'] && !changes['defaultCity'].firstChange) {
      this.cityInput = this.defaultCity;
      if (this.autoFetch) this.fetch(this.cityInput);
    }
  }

  ngAfterViewInit(): void {
    if (this.data) this.renderCharts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.tempChart?.destroy();
    this.rainChart?.destroy();
  }

  /** Triggers a fetch for the currently typed city, ignoring blank input. */
  onSubmit(): void {
    const name = this.cityInput.trim();
    if (!name) return;
    this.fetch(name);
  }

  /**
   * Requests real + AI data for the given city and re-renders the charts
   * on the next microtask so the view is committed before Chart.js reads
   * canvas dimensions.
   */
  private fetch(city: string): void {
    this.error = null;
    this.loading = true;
    this.cdr.markForCheck();

    this.service
      .getWeatherAi(city, this.daysAhead)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.data = res;
          this.loading = false;
          this.cdr.markForCheck();
          queueMicrotask(() => this.renderCharts());
        },
        error: (err) => {
          const msg =
            err?.error?.error ??
            err?.message ??
            'Could not load weather forecast.';
          this.error = String(msg);
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  /** Destroys any existing Chart.js instances and mounts fresh ones with current data. */
  private renderCharts(): void {
    if (!this.data) return;

    if (this.tempCanvas) {
      this.tempChart?.destroy();
      this.tempChart = new Chart(this.tempCanvas.nativeElement, this.buildTempConfig());
    }

    if (this.rainCanvas) {
      this.rainChart?.destroy();
      this.rainChart = new Chart(this.rainCanvas.nativeElement, this.buildRainConfig());
    }
  }

  /**
   * Builds the temperature chart config. Real and predicted points share the
   * same x-axis but live in two datasets so the predicted series can render
   * with a dashed stroke.
   */
  private buildTempConfig(): ChartConfiguration<'line'> {
    const merged = this.data!.merged;
    return {
      type: 'line',
      data: {
        labels: merged.map((p) => this.shortLabel(p.date)),
        datasets: [
          {
            label: 'Real',
            data: merged.map((p) => (p.kind === 'real' ? p.tempC : null)),
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37,99,235,0.15)',
            borderWidth: 3,
            tension: 0.3,
            pointRadius: 3,
            spanGaps: true,
            fill: true,
          },
          {
            label: 'AI predicted',
            data: merged.map((p) => (p.kind === 'predicted' ? p.tempC : null)),
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37,99,235,0.08)',
            borderWidth: 3,
            borderDash: [7, 5],
            tension: 0.3,
            pointRadius: 3,
            spanGaps: true,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400 },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(1)} °C`,
            },
          },
        },
        scales: {
          x: { grid: { display: false } },
          y: { ticks: { callback: (v) => `${v}°` } },
        },
      },
    };
  }

  /**
   * Builds the rain-probability chart config. Probabilities are scaled to
   * percentages for display; the y-axis is clamped to 0–100.
   */
  private buildRainConfig(): ChartConfiguration<'line'> {
    const merged = this.data!.merged;
    return {
      type: 'line',
      data: {
        labels: merged.map((p) => this.shortLabel(p.date)),
        datasets: [
          {
            label: 'Real',
            data: merged.map((p) => (p.kind === 'real' ? Math.round(p.rainProb * 100) : null)),
            borderColor: '#16a34a',
            backgroundColor: 'rgba(22,163,74,0.15)',
            borderWidth: 3,
            tension: 0.3,
            pointRadius: 3,
            spanGaps: true,
            fill: true,
          },
          {
            label: 'AI predicted',
            data: merged.map((p) => (p.kind === 'predicted' ? Math.round(p.rainProb * 100) : null)),
            borderColor: '#16a34a',
            backgroundColor: 'rgba(22,163,74,0.08)',
            borderWidth: 3,
            borderDash: [7, 5],
            tension: 0.3,
            pointRadius: 3,
            spanGaps: true,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400 },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}%`,
            },
          },
        },
        scales: {
          x: { grid: { display: false } },
          y: { min: 0, max: 100, ticks: { callback: (v) => `${v}%` } },
        },
      },
    };
  }

  private shortLabel(isoDate: string): string {
    const d = new Date(`${isoDate}T00:00:00Z`);
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }
}
