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
export class LoginComponent {
  username = '';
  password = '';
  error = '';

  constructor(private authService: AuthService, private router: Router) {}

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
