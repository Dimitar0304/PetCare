import { Routes } from '@angular/router';

import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { AdsListComponent } from './ads/ads-list/ads-list.component';
import { CreateAdComponent } from './ads/create-ad/create-ad.component';
import { AdDetailsComponent } from './ads/ad-details/ad-details.component';

import { authGuard } from './core/guards/auth.guard';
import { seekerGuard } from './core/guards/seeker.guard';

export const routes: Routes = [
  // Public homepage: show all available ads.
  { path: '', component: AdsListComponent, pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'ads', component: AdsListComponent },
  { path: 'ads/create', component: CreateAdComponent, canActivate: [authGuard, seekerGuard] },
  { path: 'ads/:id', component: AdDetailsComponent },
  { path: '**', redirectTo: '' },
];
