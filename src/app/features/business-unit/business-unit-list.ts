import { ChangeDetectorRef, Component, computed, DestroyRef, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { ApiService } from '../../services/api';
import { BusinessUnit } from '../../shared/services/business-unit.service';
import { FormsModule } from "@angular/forms";
import { forkJoin, Subject } from 'rxjs';
import { PaginationComponent } from "../../shared/components/pagination/pagination";
import { PopupMessageService } from '../../shared/services/popup-message.service';
import { User } from '../../models/user.model';
import { Asset } from '../../shared/models/asset.interface';
import { AssetService } from '../../shared/services/asset.service';
import { ButtonComponent } from "../../shared/components/button/button";
// import { FiltersComponent } from "../../shared/components/filters/filters";

@Component({
  selector: 'app-business-unit-list',
  imports: [FormsModule, PaginationComponent, ButtonComponent],
  templateUrl: './business-unit-list.html',
  styleUrl: './business-unit-list.css',
})
export class BusinessUnitList {
  businessUnits = signal<BusinessUnit[]>([]);
  users = signal<User[]>([]);
  assets = signal<Asset[]>([]);

  filteredBusinessUnits = signal<BusinessUnit[]>([]);
  loading = signal(true);
  reload$ = new Subject<boolean>();
  private destroyRef = inject(DestroyRef);

  @ViewChild('myDialog') dialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('newDialog') newDialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('alertDialog') alertDialog!: ElementRef<HTMLDialogElement>;
  // @ViewChild('alertStatusDialog') alertStatusDialog!: ElementRef<HTMLDialogElement>;
  // @ViewChild('errorDialog') errorDialog!: ElementRef<HTMLDialogElement>;

  editableBusinessUnit: BusinessUnit|null = null
  controlName = '';
  initialName = '';
  filterName = '';
  isVisible = signal(true);

  // errorMessage = 'Nessun errore.';
  errorTimeout: any = null;
  specifiedError = signal(false);
  touched = false;
  alertTitle = '';
  // selectedBusinessUnit: BusinessUnit|null = {
  //   id: 0,
  //   code: '',
  //   active: true,
  //   name: ''
  // };

  // Settaggio della businessUnit
  constructor(private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    private assetService: AssetService,
    private readonly popupMessageService: PopupMessageService
  ){
    const subscription = forkJoin({
      user: this.apiService.getUsers(),
      asset: this.assetService.getAssets(),
      businessUnit: this.apiService.getBusinessUnits()
    }).subscribe({
      next: ({ user, asset, businessUnit }) => {
        this.users.set(user ?? []);
        this.assets.set(asset ?? []);
        this.businessUnits.set(businessUnit ?? []);

        this.filteredBusinessUnits.set(this.businessUnits());
        this.loading.set(false);
      },
      error: (err) => {
        this.popupMessageService.error('Errore del caricamento della business unit');
        console.error('error API business unit', err);
        this.businessUnits.set([]);
        this.loading.set(false);
      }
    })
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }
  currentPage = signal(1);
  itemsPerPage = signal(5);

  // ricalcolo e aggiorno automaticamente dopo ogni cambiamento
  totalPages = computed(() => {
    return Math.ceil(this.filteredBusinessUnits().length / this.itemsPerPage());
  });
  // si aggiorna automaticamente quando cambi pagina o aggiungi/rimuovi users
  paginatedBusinessUnit = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return this.filteredBusinessUnits().slice(start, end);
  });
  //creazione stringa display range.
  displayRange = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage() + 1;
    const end = Math.min(this.currentPage() * this.itemsPerPage(), this.filteredBusinessUnits().length);
    return `Mostrando ${start}-${end} di ${this.filteredBusinessUnits().length}`;
  });

  goToPage(page: number): void {
    this.currentPage.set(page);
  }
  // Cambia lo status della business unit rendendola attiva o disattiva
  changeStatus(businessUnit: BusinessUnit){
    if(this.assets().find(asset => (asset.businessUnit === businessUnit.name)) ||
       this.users().find(user =>(user.businessUnit !== null && user.businessUnit.code === businessUnit.code))
      ){
      this.popupMessageService.error('Errore, impossibile disattivare una business unit associata ad uno user o asset');
    }
    else{
      this.editableBusinessUnit = businessUnit;
      if(this.editableBusinessUnit.active === false){
        this.editableBusinessUnit.active = true;
      }
      else{
        if(this.editableBusinessUnit.active === true){
          this.editableBusinessUnit.active = false;
        }
      }
      this.apiService.putBusinessActiveChangeById(this.editableBusinessUnit.code, this.editableBusinessUnit.active)
      .subscribe({
        next: (updatedAssetType) => {
          const updatedList = this.businessUnits().map(at => at.code === updatedAssetType.code ? updatedAssetType : at);
          this.businessUnits.set(updatedList);
          this.reloadDiv();
        },
        error: (err) => {
          this.popupMessageService.error('Errore durante l\'aggiornamento dell\'attivazione della business unit');
          console.error('errore attivazione business unit', err);
        }
      });
    }
  }
  // funzione che filtra la lista delle business unit
  onFilter() {
    let filtered = this.businessUnits();

    if (this.filterName !== '') {
      const searchName = this.filterName.toLowerCase();
      filtered = filtered.filter(asset =>
        asset.name.toLowerCase().includes(searchName)
      );
    }

    this.filteredBusinessUnits.set(filtered);
  }
  // Diverse funzioni che si attivano prima durante o dopo la modifica di un tipo
  OnOpenDialog(businessUnit: BusinessUnit){
    this.editableBusinessUnit = businessUnit;
    this.initialName = businessUnit.name;
    this.controlName = businessUnit.name;
  
    this.dialog.nativeElement.showModal();
    this.alertTitle = 'Conferma la modifica di questa Business unit?';
  }
  onCloseDialog(){
    this.touched = false;
    this.reloadDiv();
    this.alertTitle = '';
    this.dialog.nativeElement.close();
  }
  onDialogBackdropClick(event: MouseEvent): void {
    this.onCloseDialog();
  }
  onConfirmEdit(){
    if(this.editableBusinessUnit !== null){
      let modifiedName = this.initialName.toLowerCase();
      modifiedName = modifiedName.charAt(0).toUpperCase() + modifiedName.slice(1);

      this.editableBusinessUnit.name = modifiedName;

      const puttableBusinessUnit = { 
        name: modifiedName
      };
      this.apiService.putBusinessUnitById(this.editableBusinessUnit?.code, puttableBusinessUnit)
      .subscribe({
        next: (updatedBusinessUnit) => {
          const updatedList = this.businessUnits().map(at => at.code === updatedBusinessUnit.code ? updatedBusinessUnit : at);
          this.businessUnits.set(updatedList);

          this.filteredBusinessUnits.set(
            this.filteredBusinessUnits().map(bu => 
              bu.code === updatedBusinessUnit.code ? updatedBusinessUnit : bu
            )
          );

          this.initialName = '';
          this.controlName = '';
          this.alertTitle = '';
          this.dialog.nativeElement.close();
          this.popupMessageService.success('Business unit modificata con successo');
          this.reloadDiv();
        },
        error: (err) => {
          this.popupMessageService.error('Errore durante l\'aggiornamento della business unit');
          console.error('errore aggiornamento business unit', err);
          this.initialName = '';
          this.alertTitle = '';
          this.controlName = '';
          this.dialog.nativeElement.close();
        }
      });
    }
  }
  isInvalid(): boolean {
    return !(this.initialName.length > 1 && this.controlRepeatedName(this.initialName.trim()));
  }
  get specifiedMessage(): string {
    if (this.initialName.length <= 2) {
      return 'Deve essere almeno 2 caratteri';
    }
    return 'Il nome deve essere diverso da uno già presente';
  }
  scheduleErrorCheck(): void {
    clearTimeout(this.errorTimeout);
    this.errorTimeout = setTimeout(() => {
      this.specifiedError.set(this.initialName.length > 0 && this.isInvalid());
    }, 50)
  }
  OnOpenNewDialog(){
    this.newDialog.nativeElement.showModal();
    this.initialName = '';
    this.alertTitle = 'Conferma la creazione di una nuova business unit?';
  }
  // onAdd(){
  //   let cretaedName = this.initialName.toLowerCase();
  //   cretaedName = cretaedName.charAt(0).toUpperCase() + cretaedName.slice(1);

  //   this.newBusinessUnit!.name = cretaedName;
  // }
  onCloseNewDialog(){
    this.touched = false;
    this.initialName = '';
    this.reloadDiv();
    this.alertTitle = '';

    this.newDialog.nativeElement.close();
  }
  onNewDialogBackdropClick(event: MouseEvent): void {
    this.onCloseNewDialog();
  }
  onConfirmCreate(){
    let cretaedName = this.initialName.toLowerCase();
    cretaedName = cretaedName.charAt(0).toUpperCase() + cretaedName.slice(1);

    const postableBusinessUnit = { 
      name: cretaedName
    };
    this.apiService.postBusinessUnit(postableBusinessUnit)
    .subscribe({
      // next: (createdBusinessUnit) => {
      //   console.log(createdBusinessUnit);
      //   const updatedList = [...this.businessUnits(), createdBusinessUnit];
      //   this.businessUnits.set(updatedList);

      //   this.filteredBusinessUnits.set([...this.filteredBusinessUnits(), createdBusinessUnit]);
      //   // this.onFilter();

      //   this.popupMessageService.success('Business unit creata con successo');
      //   this.initialName = '';
      //   this.alertTitle = '';
      //   this.reloadDiv();
      //   this.newDialog.nativeElement.close();
      // },
      next: () => {
        this.apiService.getBusinessUnits().subscribe({
          next: (freshList) => {
            this.businessUnits.set(freshList);
            this.filteredBusinessUnits.set(freshList);
            this.popupMessageService.success('Business unit creata con successo');
          }
        });

        this.initialName = '';
        this.alertTitle = '';
        this.reloadDiv();
        this.newDialog.nativeElement.close();
      },
      error: (err) => {
        this.popupMessageService.error('Errore durante la creazione della business unit');
        console.error('errore creazione business unit', err);
        this.initialName = '';
        this.alertTitle = '';
        this.newDialog.nativeElement.close();
      }
    })
  }
  reloadDiv() {
    this.isVisible.set(false);
    setTimeout(() => {
      this.isVisible.set(true);
      this.reload$.next(true);
    }, 0);
  }
  controlRepeatedName(BusinessUnitName: string){
    if(this.businessUnits().find(unit => (
      unit.name !== null &&
      unit.name.toLowerCase() === BusinessUnitName.toLowerCase() &&
      unit.name.toLowerCase() !== this.controlName.toLowerCase()
    ))){
      return false;
    }
    else{ return true; }
  }
  onAlertDialogOpen(){
    this.alertDialog.nativeElement.showModal();
  }
 onAlertDialogClose(){
    // this.selectedBusinessUnit = null;
    this.alertDialog.nativeElement.close();
    // this.alertStatusDialog.nativeElement.close();
  }
  // onAlertChangeStatus(businessUnit: BusinessUnit){
  //   this.selectedBusinessUnit = businessUnit;
  //   this.alertTitle = 'Conferma il cambiamento di status di '+ businessUnit.name +'?'
  //   this.alertStatusDialog.nativeElement.showModal();
  // }
  onChoosingPath(){
    if(this.alertTitle === 'Conferma la creazione di una nuova business unit?'){
      this.onConfirmCreate();
    }
    else{
      if(this.alertTitle === 'Conferma la modifica di questa Business unit?'){
        this.onConfirmEdit();
      }
      else{ this.popupMessageService.error('errore nella conferma'); }
    }
    this.alertDialog.nativeElement.close();
    // this.alertStatusDialog.nativeElement.close();
  }
  // onErrorOccur(){
  //   this.errorDialog.nativeElement.showModal();
  // }
  // onErrorWindowsClose(){
  //   this.errorDialog.nativeElement.close();
  // }
}
