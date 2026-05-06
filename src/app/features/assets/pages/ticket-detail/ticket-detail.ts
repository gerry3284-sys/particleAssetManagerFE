import { Component, computed, DestroyRef, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { Reply, Ticket } from '../../../../models/ticket.model';
import { ActivatedRoute, Router } from '@angular/router';
import { AssetService } from '../../../../shared/services/asset.service';
import { PopupMessageService } from '../../../../shared/services/popup-message.service';
import { ApiService } from '../../../../services/api';
import { forkJoin } from 'rxjs/internal/observable/forkJoin';
import { DatePipe } from '@angular/common';
import { PaginationComponent } from "../../../../shared/components/pagination/pagination";
import { ButtonComponent } from "../../../../shared/components/button/button";
import { FormsModule } from '@angular/forms';
import { User } from '../../../../models/user.model';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-ticket-detail',
  imports: [DatePipe, PaginationComponent, ButtonComponent, FormsModule],
  templateUrl: './ticket-detail.html',
  styleUrl: './ticket-detail.css',
})
export class TicketDetail {
    ticket = signal<Ticket | null>(null);
    replies = signal<Reply[]>([]);
    users = signal<User[]>([]);
    
    message = '';
    alertTitle = '';
    closed = false;

    // isVisible = signal(true);
    // reload$ = new Subject<boolean>();
    loading = signal(true);
    private destroyRef = inject(DestroyRef);

    @ViewChild('alertDialog') alertDialog!: ElementRef<HTMLDialogElement>;

    constructor(private apiService: ApiService,
      public route: ActivatedRoute,
      private readonly popupMessageService: PopupMessageService,
      private router: Router
    ){
      const ticketCode = this.route.snapshot.paramMap.get('ticketCode');

      const subscription = forkJoin({
        ticket: this.apiService.getTicketByCode(ticketCode ?? ''),
        replies: this.apiService.getTicketChat(ticketCode ?? ''),
        users: this.apiService.getUsers()
      }).subscribe({
        next: (results) => {
          this.ticket.set(results.ticket);
          this.replies.set(results.replies);
          this.users.set(results.users);

          this.loading.set(false);
        }
      , error: (error) => {
          console.error('Errore durante il recupero dei dati:', error);
          this.popupMessageService.error('Errore durante il caricamento dei dati');
          this.ticket.set(null);
          this.replies.set([]);
          this.users.set([]);

          this.loading.set(false);
        }
      });
      this.destroyRef.onDestroy(() => subscription.unsubscribe());
    }

  sortedReplies = computed(() => [...this.replies()].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

  username = computed(() => {
    const user = this.users().find(u => u.oid === this.ticket()?.userCode);
    return `${user?.name} ${user?.surname}`
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
  // onAlertClosingDialogOpen(){
  //   this.alertTitle = 'Conferma invio risposta e chiusura ticket';
  //   this.alertDialog.nativeElement.showModal();
  // }

  changeStatusInWorking(){
    const status = 'WORKING';
    this.apiService.putTicketChangeStatus(this.ticket()!.ticketCode, status, this.ticket()!).subscribe({
      next: (updatedTicket) =>{
        this.ticket.set(updatedTicket);
      },
      error: (err) =>{
        this.popupMessageService.error('Errore durante l\'aggiornamento dello stato del ticket');
        console.error('errore cambiamento stato', err);
      }
    });
  }
  changeStatusInClosed(){
    const status = 'CLOSED';
    this.apiService.putTicketChangeStatus(this.ticket()!.ticketCode, status, this.ticket()!).subscribe({
      next: (updatedTicket) =>{
        this.ticket.set(updatedTicket);
      },
      error: (err) =>{
        this.popupMessageService.error('Errore durante l\'aggiornamento dello stato del ticket');
        console.error('errore cambiamento stato', err);
      }
    });
  }
  onPostReply(){
    // const user = this.ticket()?.userCode;

    // if(this.alertTitle.includes('chiusura')){
    //   this.closed = true;
    // }
    const postableReply = {
      message: this.message,
      // oid: user,
      oid: '1f3c9b82-7a41-4e3d-9c2a-91f4b0d7e8a1',
      // closed: this.closed
    }

    this.apiService.postReply(postableReply, this.ticket()?.ticketCode ?? '').subscribe({
      next: (createdReply) =>{
        this.replies.update(replies => [createdReply, ...replies]);
        this.message = ''
        
        if(this.closed){
          this.popupMessageService.success('Risposta inviata con successo e ticket chiuso');
          this.router.navigate(['/assets/tickets']);
        } else {
          this.popupMessageService.success('Risposta inviata con successo');
        }
        
        this.apiService.putTicketInProgress(this.ticket()!.ticketCode);
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
    this.router.navigate(['/tickets']);
  }
  //   reloadDiv() {
  //   this.isVisible.set(false);
  //   setTimeout(() => {
  //     this.isVisible.set(true);
  //     this.reload$.next(true);
  //   }, 0);
  // }
}
