import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth-service';
import { FormsModule, NgModel } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';


@Component({
  selector: 'app-login',
  templateUrl: './login-component.html',
  imports:[BrowserModule,FormsModule,RouterModule]
})
/**
 * Legacy login page backed by the older template-driven {@link AuthService}
 * under `src/app/services/`. The modern flow uses
 * `src/app/auth/login/login.component.ts` with reactive forms.
 */
export class LoginComponent {
  username = '';
  password = '';
  error = '';

  constructor(private authService: AuthService, private router: Router) {}

  /**
   * Calls the legacy auth service and navigates home on success or sets a
   * generic error message on failure.
   */
  login() {
    this.authService.login(this.username, this.password).subscribe({
      next: () => {
        // Navigate to home after successful login
        this.router.navigate(['/home']);
      },
      error: () => {
        this.error = 'Invalid credentials';
      }
    });
  }
}
