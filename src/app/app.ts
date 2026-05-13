import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PopupMessageComponent } from './shared/components/popup-message/popup-message';

@Component({
  selector: 'app-root',
  standalone: true,      // importantissimo!
  imports: [RouterOutlet, PopupMessageComponent],
  //template: `<router-outlet></router-outlet>` // qui girano tutte le rotte
  templateUrl: './app.html', // Prendiamo come riferimento tutto il file piuttosto del semplice tag router-outlet
})
export class App {}
