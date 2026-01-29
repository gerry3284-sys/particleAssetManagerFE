import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  styleUrls: ['./sidebar.css'],
  templateUrl: './sidebar.html',
})
export class Sidebar {

  constructor(private readonly router: Router) {}

  onLogout() {
    this.router.navigate(['/login']);
  }

}
