import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,      // importantissimo!
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>` // qui girano tutte le rotte
})
export class App {}
