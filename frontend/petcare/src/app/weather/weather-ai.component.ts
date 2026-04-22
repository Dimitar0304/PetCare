import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WeatherWidgetComponent } from './weather-widget.component';

@Component({
  selector: 'app-weather-ai-page',
  standalone: true,
  imports: [CommonModule, WeatherWidgetComponent],
  template: `
    <div class="container py-4">
      <div class="mb-4">
        <h1 class="display-6 fw-semibold mb-1">AI Weather Agent</h1>
        <p class="text-muted mb-0">
          Real-time OpenWeather data combined with an on-the-fly linear-regression
          forecast of the next few days. Solid lines are real, dashed lines are AI predictions.
        </p>
      </div>

      <app-weather-widget [defaultCity]="'Sofia'" [daysAhead]="4" [autoFetch]="true"></app-weather-widget>
    </div>
  `,
})
/**
 * Full-page host for the AI weather feature. Wraps the reusable
 * {@link WeatherWidgetComponent} with page-level copy and sensible defaults.
 */
export class WeatherAiPageComponent {}
