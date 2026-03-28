import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { BackendRoles, LoginPayload, RegisterPayload, UserRole } from '../../models/auth.models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  styleUrl: './register.component.css',
  template: `
    <div class="container py-4" style="max-width: 720px;">
      <h2 class="mb-3">Register</h2>

      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label">First name</label>
            <input class="form-control" formControlName="firstName" autocomplete="given-name" />
            <div class="text-danger small" *ngIf="firstName.invalid && (firstName.dirty || firstName.touched)">
              First name is required.
            </div>
          </div>

          <div class="col-md-6">
            <label class="form-label">Last name</label>
            <input class="form-control" formControlName="lastName" autocomplete="family-name" />
            <div class="text-danger small" *ngIf="lastName.invalid && (lastName.dirty || lastName.touched)">
              Last name is required.
            </div>
          </div>

          <div class="col-md-6">
            <label class="form-label">Username</label>
            <input class="form-control" formControlName="userName" autocomplete="username" />
          </div>

          <div class="col-md-6">
            <label class="form-label">Phone</label>
            <input class="form-control" formControlName="phone" autocomplete="tel" />
          </div>

          <div class="col-md-6">
            <label class="form-label">Email</label>
            <input class="form-control" formControlName="email" autocomplete="email" />
            <div class="text-danger small" *ngIf="email.invalid && (email.dirty || email.touched)">
              <div *ngIf="email.errors?.['required']">Email is required.</div>
              <div *ngIf="email.errors?.['email']">Enter a valid email.</div>
            </div>
          </div>

          <div class="col-md-6">
            <label class="form-label">Role</label>
            <select class="form-select" formControlName="role">
              <option value="Seeker">Seeker (Pet owner)</option>
              <option value="Provider">Provider (Pet sitter)</option>
            </select>
          </div>

          <div class="col-md-6">
            <label class="form-label">Password</label>
            <input type="password" class="form-control" formControlName="password" autocomplete="new-password" />
            <div class="text-danger small" *ngIf="password.invalid && (password.dirty || password.touched)">
              <div *ngIf="password.errors?.['required']">Password is required.</div>
              <div *ngIf="password.errors?.['minlength']">Password must be at least 4 characters.</div>
            </div>
          </div>
        </div>

        <div class="d-grid gap-2 mt-4">
          <button class="btn btn-primary" type="submit" [disabled]="form.invalid || loading">
            {{ loading ? 'Creating account...' : 'Register' }}
          </button>
        </div>

        <div class="alert alert-danger mt-3" *ngIf="apiError">
          {{ apiError }}
        </div>

        <div class="mt-3 text-muted">
          Already have an account?
          <a routerLink="/login">Login</a>
        </div>
      </form>
    </div>
  `,
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  loading = false;
  apiError: string | null = null;

  form = new FormGroup({
    firstName: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    userName: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    phone: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.minLength(4)] }),
    role: new FormControl<UserRole>('Seeker', { nonNullable: true, validators: [Validators.required] }),
  });

  get firstName() {
    return this.form.controls.firstName;
  }
  get lastName() {
    return this.form.controls.lastName;
  }
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

    const raw = this.form.getRawValue();
    const backendRole = raw.role === 'Seeker' ? BackendRoles.seeker : BackendRoles.provider;

    const payload: RegisterPayload = {
      firstName: raw.firstName,
      lastName: raw.lastName,
      email: raw.email,
      phone: raw.phone,
      password: raw.password,
      role: backendRole,
      userName: raw.userName,
    };

    this.auth.register(payload).subscribe({
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
    if (typeof e?.error?.message === 'string') return e.error.message;
    if (typeof e?.message === 'string') return e.message;
    return 'Registration failed. Please check your details.';
  }
}

