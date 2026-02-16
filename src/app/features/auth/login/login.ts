import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators
} from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent {

  loginForm = new FormGroup<{
    email: FormControl<string>;
    password: FormControl<string>;
  }>({
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  constructor(private readonly router: Router) {}

  onLogin() {
    // Segna tutti i campi come "touched" per mostrare gli errori
    this.loginForm.markAllAsTouched();

    if (this.loginForm.invalid) {
      // Non navigare se il form non è valido
      return;
    }

    const { email, password } = this.loginForm.value;
    console.log('Email:', email);
    console.log('Password:', password);

    this.router.navigate(['/assets']);
  }
}
