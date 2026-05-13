import { Component, computed, DestroyRef, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { Reply, Ticket } from '../../../models/ticket.model';
import { ApiService } from '../../../services/api';
import { AssetService } from '../../../shared/services/asset.service';
import { PopupMessageService } from '../../../shared/services/popup-message.service';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs/internal/observable/forkJoin';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../shared/components/button/button';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-user-standard-tickets-detail',
  imports: [DatePipe, PaginationComponent, ButtonComponent, FormsModule],
  templateUrl: './user-standard-tickets-detail.html',
  styleUrl: './user-standard-tickets-detail.css',
})
export class UserStandardTicketsDetail {
    ticket = signal<Ticket | null>(null);
    replies = signal<Reply[]>([]);
    user = signal<User | null>(null);
    
    message = '';
    alertTitle = '';
    closed = false;
    loading = signal(true);
    private destroyRef = inject(DestroyRef);

    @ViewChild('alertDialog') alertDialog!: ElementRef<HTMLDialogElement>;

    constructor(private apiService: ApiService,
      public route: ActivatedRoute,
      private readonly popupMessageService: PopupMessageService,
      private router: Router
    ){
      const ticketCode = this.route.snapshot.paramMap.get('ticketCode');
      const id = this.route.snapshot.paramMap.get('oid');

      const subscription = forkJoin({
        user: this.apiService.getUsersById(id? id:''),
        ticket: this.apiService.getTicketByCode(ticketCode ?? ''),
        replies: this.apiService.getTicketChat(ticketCode ?? '')
      }).subscribe({
        next: (results) => {
          this.user.set(results.user);
          this.ticket.set(results.ticket);
          this.replies.set(results.replies);
          this.loading.set(false);
        }
      , error: (error) => {
          console.error('Errore durante il recupero dei dati:', error);
          this.popupMessageService.error('Errore durante il caricamento dei dati');
          this.user.set(null);
          this.ticket.set(null);
          this.replies.set([]);
          this.loading.set(false);
        }
      });
      this.destroyRef.onDestroy(() => subscription.unsubscribe());
    }

    sortedReplies = computed(() =>
      [...this.replies()].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    );

    fullName = computed(() => {
      const user = this.user();
      if (!user) return '-';
      return `${user.name} ${user.surname}`;
    });

  currentPage = signal(1);
  itemsPerPage = signal(8);

  // ricalcolo e aggiorno automaticamente dopo ogni cambiamento
  totalPages = computed(() => {
    return Math.ceil(this.sortedReplies().length / this.itemsPerPage());
  });

  // si aggiorna automaticamente quando cambi pagina o aggiungi/rimuovi users
  paginatedReplies = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return this.sortedReplies().slice(start, end);
  });

  //creazione stringa display range.
  displayRange = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage() + 1;
    const end = Math.min(this.currentPage() * this.itemsPerPage(), this.sortedReplies().length);
    return `Mostrando ${start}-${end} di ${this.sortedReplies().length}`;
  });
  goToPage(page: number): void {
    this.currentPage.set(page);
  }

  onAlertDialogOpen(){
    this.alertTitle = 'Conferma invio risposta';
    this.alertDialog.nativeElement.showModal();
  }
  onAlertDialogClose(){
    this.alertTitle = '';
    this.alertDialog.nativeElement.close();
  }
  onAlertClosingDialogOpen(){
    this.alertTitle = 'Conferma invio risposta e chiusura ticket';
    this.alertDialog.nativeElement.showModal();
  }

  onPostReply(){
    const user = this.ticket()?.userCode;

    /*if(this.alertTitle.includes('chiusura')){
      this.closed = true;
    }*/
    const postableReply = {
      message: this.message,
      //oid: user,
      oid: user,
      closed: this.closed
    }

    this.apiService.postReply(postableReply, this.ticket()?.ticketCode ?? '').subscribe({
      next: (createdReply) =>{
        const updatedReplies = [...this.replies(), createdReply];
        this.replies.set(updatedReplies);
        /*if(this.closed){
          this.popupMessageService.success('Risposta inviata con successo e ticket chiuso');
          this.router.navigate(['/assets/tickets']);
        }
        else{*/
          this.message = '';
          console.log('Risposta inviata con successo');
          this.popupMessageService.success('Risposta inviata con successo');
        //}
        this.alertTitle = '';
        this.alertDialog.nativeElement.close();
      },
      error: (error) => {
        console.error('Errore durante l\'invio della risposta:', error);
        this.popupMessageService.error('Errore durante l\'invio della risposta');
        this.alertDialog.nativeElement.close();
      }
    }); 
  }
  isInvalid(stato: string | undefined): boolean {
    return !(this.message.trim().length > 0 && stato !== 'CLOSED' && this.message.length <= 500);
  }
  isInvalidTextArea(stato: string | undefined): boolean{
    return !(stato !== 'CLOSED');
  }
  goBack(): void {
    this.router.navigate(['/user-standard', this.ticket()?.userCode, 'ticket']);
  }
}
