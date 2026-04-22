import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth-service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-home',
  templateUrl: './home-component.html',
  standalone:true,
  imports:[NgIf]
})
/**
 * Legacy home page (retained for backwards compatibility).
 *
 * Uses the older {@link AuthService} located under `src/app/services/` to
 * display the current user's name. The modern application shell routes
 * users directly to the ads list instead.
 */
export class HomeComponent implements OnInit {
  username = '';

  constructor(public auth: AuthService, private router: Router) {}

  ngOnInit() {
    // If logged in, fetch username
    if (this.auth.getToken()) {
      this.auth.getCurrentUser().subscribe({
        next: res => this.username = res.username,
        error: () => this.auth.logout() // clear invalid token
      });
    }
  }

  /** Clears the session locally and returns the user to the home page. */
  logout() {
    this.auth.logout();
    this.username = '';
    this.router.navigate(['/home']);
  }
}
