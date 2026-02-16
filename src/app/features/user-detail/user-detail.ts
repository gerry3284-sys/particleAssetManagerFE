import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive } from "@angular/router";
import { ApiService } from '../../services/api';
import { User, MovementByuserID } from '../../models/user.model';
import { DatePipe } from '@angular/common';
import { forkJoin } from 'rxjs';

//TODO se si mettono troppi valori nel movement la sidebar segue lo scorrimento verso il basso invece di rimanere bloccata

@Component({
  selector: 'app-user-detail',
  imports: [RouterLink, RouterLinkActive, DatePipe],
  templateUrl: './user-detail.html',
  styleUrl: './user-detail.css',
})
export class UserDetail{
  user = signal<User | null>(null);
  movements = signal<MovementByuserID[]>([]);
  destroyRef = inject(DestroyRef);

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

  constructor(private apiService: ApiService, public route: ActivatedRoute) {
  const id = this.route.snapshot.paramMap.get('id');
  if (!id) return;
  const subscription = forkJoin({
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
  this.destroyRef.onDestroy(() => subscription.unsubscribe())
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
}
