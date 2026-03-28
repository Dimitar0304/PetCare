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

  logout() {
    this.auth.logout();
    this.username = '';
    this.router.navigate(['/home']);
  }
}
