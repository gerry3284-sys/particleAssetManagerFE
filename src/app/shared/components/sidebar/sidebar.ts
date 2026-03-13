import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ButtonComponent } from '../button/button';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, ButtonComponent],
  styleUrl: './sidebar.css',
  templateUrl: './sidebar.html',
})
export class SidebarComponent {

  constructor(private readonly router: Router) {}

  onLogout() {
    this.router.navigate(['/login']);
  }

}
