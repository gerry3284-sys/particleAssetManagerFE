 import { Component, computed, signal } from '@angular/core';
 import { ActivatedRoute, Router } from "@angular/router";
import { ApiService } from '../../../services/api';
import { User, MovementByuserID } from '../../../models/user.model';
import { DatePipe } from '@angular/common';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-user-standard',
  imports: [DatePipe],
  templateUrl: './user-standard.html',
  styleUrl: './user-standard.css',
})
export class UserStandard {
//TODO aggiungere destroyref ai subscribe
//TODO se si mettono troppi valori nel movement la sidebar segue lo scorrimento verso il basso invece di rimanere bloccata

  user = signal<User | null>(null)
  movements = signal<MovementByuserID[]>([])

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

  constructor(private apiService: ApiService, private route: ActivatedRoute, private router: Router) {
  const id = this.route.snapshot.paramMap.get('id');
  if (!id) return;
  forkJoin({
    user: this.apiService.getUsersById(+id),
    movements: this.apiService.getMovementByUserId(+id),
  }).subscribe({
    next: ({ user, movements }) => {
      this.user.set(user ?? {});

      const processed = this.mergeMovements(movements ?? []);
      this.movements.set(processed);
    },
    error: err => {
      console.error('API error', err);
      this.user.set(null);
    }
  });
  }
  mergeMovements(movements: MovementByuserID[]): MovementByuserID[]{
  const toDelete = new Set<number>();

  const result = movements.map(move => {
    if (move.movementType === 'Assigned') {
      const returned = movements.find(
        m =>
          m.asset.serialNumber === move.asset.serialNumber &&
          m.movementType === 'Returned'
      );
      if (returned) {
        toDelete.add(returned.id);
        return { ...move, updateDate: returned.date };
      }
    }
    return move;
  });
  return result.filter(m => !toDelete.has(m.id));
  }
  onNavigate(){
  this.router.navigate(['/users', 'user-detail', 2]);
  console.log('Navigation triggered');
  }
}