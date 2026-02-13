import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'user-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './user-layout.html',
})
export class UserLayoutComponent {}
