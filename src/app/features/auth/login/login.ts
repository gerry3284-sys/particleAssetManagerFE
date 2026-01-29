import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login {
  constructor(private readonly router: Router) {}

  onLogin() {
    this.router.navigate(['/assets']);
  }
}
