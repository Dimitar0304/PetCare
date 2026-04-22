import { Routes } from '@angular/router';

import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { AdsListComponent } from './ads/ads-list/ads-list.component';
import { CreateAdComponent } from './ads/create-ad/create-ad.component';
import { EditAdComponent } from './ads/edit-ad/edit-ad.component';
import { AdDetailsComponent } from './ads/ad-details/ad-details.component';
import { InboxComponent } from './inbox/inbox.component';
import { AdminPanelComponent } from './admin/admin-panel/admin-panel.component';
import { SettingsComponent } from './settings/settings.component';
import { WeatherAiPageComponent } from './weather/weather-ai.component';

import { authGuard } from './core/guards/auth.guard';
import { seekerGuard } from './core/guards/seeker.guard';
import { adminGuard } from './core/guards/admin.guard';

/**
 * Top-level route table for the Angular app.
 *
 * - Public routes: home ads list, login, register, ads listing/details, weather page.
 * - `authGuard` protects anything that requires a valid session (inbox, settings).
 * - `seekerGuard` restricts ad-creation and ad-editing to users with the
 *   `Seeker` role on top of authentication.
 * - `adminGuard` restricts the moderation panel to users with the `Admin` role.
 * - The wildcard route redirects unknown paths back to the home page.
 */
export const routes: Routes = [
  { path: '', component: AdsListComponent, pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'ads', component: AdsListComponent },
  { path: 'ads/create', component: CreateAdComponent, canActivate: [authGuard, seekerGuard] },
  { path: 'ads/:id/edit', component: EditAdComponent, canActivate: [authGuard, seekerGuard] },
  { path: 'ads/:id', component: AdDetailsComponent },
  { path: 'inbox', component: InboxComponent, canActivate: [authGuard] },
  { path: 'settings', component: SettingsComponent, canActivate: [authGuard] },
  { path: 'admin', component: AdminPanelComponent, canActivate: [adminGuard] },
  { path: 'weather', component: WeatherAiPageComponent },
  { path: '**', redirectTo: '' },
];
