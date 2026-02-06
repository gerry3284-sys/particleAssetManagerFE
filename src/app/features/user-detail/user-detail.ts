import { Component, computed, signal } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive } from "@angular/router";
import { ApiService } from '../../services/api';
import { User, Movement } from '../../models/user.model';


//TODO aggiungere destroyref ai subscribe
//TODO se si mettono troppi valori nel movement la sidebar segue lo scorrimento verso il basso invece di rimanere bloccata

@Component({
  selector: 'app-user-detail',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './user-detail.html',
  styleUrl: './user-detail.css',
})
export class UserDetail{
  user = signal<User | null>(null)

  fullName = computed(() => {
    const user = this.user();
    if (!user) return '-';
    return `${user.name} ${user.surname}`;
  });
  businessUnit = computed(() => {
    const user = this.user();
    if (!user) return '-';
    return `${user.businessUnit.name}`;
  });
  email = computed(() => {
    const user = this.user();
    if (!user) return '-';
    return `${user.email}`;
  });
  phoneNumber = computed(() => {
    const user = this.user();
    if (!user) return '-';
    return `${user.phoneNumber}`;
    
  });

  constructor(private apiService: ApiService, private route: ActivatedRoute) {
    let id: string|null = '';
    this.route.paramMap.subscribe(params => { id = params.get('id'); });
    console.log(id);
    this.apiService.getUsersById(+id).subscribe({
      next: data => this.user.set(data ?? {}),
      error: err => {
        console.error('API error', err);
        this.user.set(null);
      }
    });
  }

  movements: Movement[] = ([
    {
      id: 1,
      dismesso: false,
      marca: 'Apple',
      modello: 'MacBook Pro 14',
      numeroSeriale: 'C02XXXXXX',
      dataAssegnazione: '10/01/2023',
      dataRiconsegna: '-'
    },
    {
      id: 2,
      dismesso: true,
      marca: 'Apple',
      modello: 'iPhone',
      numeroSeriale: 'F17XXXXXX',
      dataAssegnazione: '10/01/2023',
      dataRiconsegna: '10/01/2025'
    },
    {
      id: 3,
      dismesso: false,
      marca: 'Vodafone',
      modello: 'SIM Dati',
      numeroSeriale: '893910XXXXXX',
      dataAssegnazione: '10/01/2023',
      dataRiconsegna: '-'
    },
    {
      id: 4,
      dismesso: true,
      marca: 'Apple',
      modello: 'iPhone',
      numeroSeriale: 'F17XXXXXX',
      dataAssegnazione: '10/01/2023',
      dataRiconsegna: '10/01/2025'
    },
    {
      id: 5,
      dismesso: false,
      marca: 'Apple',
      modello: 'MacBook Pro 14',
      numeroSeriale: 'C02XXXXXX',
      dataAssegnazione: '10/01/2023',
      dataRiconsegna: '-'
    },
     {
      id: 6,
      dismesso: true,
      marca: 'Apple',
      modello: 'iPhone',
      numeroSeriale: 'F17XXXXXX',
      dataAssegnazione: '10/01/2023',
      dataRiconsegna: '10/01/2025'
    },
     {
      id: 7,
      dismesso: true,
      marca: 'Apple',
      modello: 'iPhone',
      numeroSeriale: 'F17XXXXXX',
      dataAssegnazione: '10/01/2023',
      dataRiconsegna: '10/01/2025'
    },
  ]);
}
