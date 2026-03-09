import { Component, signal } from '@angular/core';
import { Login } from './auth/login/login';

@Component({
  selector: 'app-root',
  standalone:true,
  imports: [Login],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('petcare');
}
