import { CommonModule, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth-service';
import { Router } from '@angular/router';

@Component({
  selector: 'login',
  standalone:true,
  imports: [ReactiveFormsModule,CommonModule,FormsModule,NgIf],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private username: string = '';
  private password: string = '';
  constructor(private authService: AuthService,private router:Router) {}

 onSubmit(f:any)
 {
   if (f.valid) {
      this.authService.login(this.username, this.password)
        .subscribe({
          next: (res: any) => {

            this.authService.saveToken(res.token);
            this.router.navigate(['/ads']);
          },
          error: (err) => {
            console.error('Login failed', err);
            alert('Invalid username or password');
          }
        });
    }
  }
 }
