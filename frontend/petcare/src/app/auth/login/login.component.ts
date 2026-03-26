import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { LoginPayload } from '../../models/auth.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="container py-4" style="max-width: 520px;">
      <h2 class="mb-3">Login</h2>

      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="mb-3">
          <label class="form-label">Email</label>
          <input type="email" class="form-control" formControlName="email" autocomplete="email" />
          <div class="text-danger small" *ngIf="email.invalid && (email.dirty || email.touched)">
            <div *ngIf="email.errors?.['required']">Email is required.</div>
            <div *ngIf="email.errors?.['email']">Enter a valid email.</div>
          </div>
        </div>

        <div class="mb-3">
          <label class="form-label">Password</label>
          <input
            type="password"
            class="form-control"
            formControlName="password"
            autocomplete="current-password"
          />
          <div class="text-danger small" *ngIf="password.invalid && (password.dirty || password.touched)">
            <div *ngIf="password.errors?.['required']">Password is required.</div>
            <div *ngIf="password.errors?.['minlength']">Password must be at least 4 characters.</div>
          </div>
        </div>

        <div class="d-grid gap-2">
          <button class="btn btn-primary" type="submit" [disabled]="form.invalid || loading">
            {{ loading ? 'Logging in...' : 'Login' }}
          </button>
        </div>

        <div class="alert alert-danger mt-3" *ngIf="apiError">
          {{ apiError }}
        </div>

        <div class="mt-3 text-muted">
          New here?
          <a routerLink="/register">Create an account</a>
        </div>
      </form>
    </div>
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  loading = false;
  apiError: string | null = null;

  form = new FormGroup({
    email: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.minLength(4)] }),
  });

  get email() {
    return this.form.controls.email;
  }
  get password() {
    return this.form.controls.password;
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.apiError = null;

    const payload: LoginPayload = this.form.getRawValue();

    this.auth.login(payload).subscribe({
      next: () => this.router.navigate(['/ads']),
      error: (err) => {
        this.loading = false;
        this.apiError = this.getApiErrorMessage(err);
      },
    });
  }

  private getApiErrorMessage(err: unknown): string {
    const e = err as any;
    if (typeof e?.error === 'string') return e.error;
    if (Array.isArray(e?.error?.errors) && e.error.errors.length) return e.error.errors.join(', ');
    if (Array.isArray(e?.error?.Errors) && e.error.Errors.length) return e.error.Errors.join(', ');
    if (typeof e?.message === 'string') return e.message;
    return 'Login failed. Please check your credentials.';
  }
}

