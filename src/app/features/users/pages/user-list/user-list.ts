import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-user-list',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './user-list.html',
  styleUrl: './user-list.css',
})
export class UserList implements OnInit{
  ngOnInit(): void {
    console.log('UsersList caricato');
  }
  tentativi = [
    {
      id: 1,
      utente: 'tentativo 1',
      email: 'email 1',
      business_unit: 'azienda 1'
    },
    {
      id: 2,
      utente: 'tentativo 2',
      email: 'email 2',
      business_unit: 'azienda 2'
    },
    {
      id: 3,
      utente: 'tentativo 3',
      email: 'email 3',
      business_unit: 'azienda 3'
    },
    {
      id: 4,
      utente: 'tentativo 4',
      email: 'email 4',
      business_unit: 'azienda 4'
    }
  ]
}
