import { ChangeDetectorRef, Component, computed, DestroyRef, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { ApiService } from '../../services/api';
import { BusinessUnit } from '../../shared/services/business-unit.service';
import { FormsModule } from "@angular/forms";
import { Subject } from 'rxjs';
import { PaginationComponent } from "../../shared/components/pagination/pagination";

@Component({
  selector: 'app-business-unit-list',
  imports: [FormsModule, PaginationComponent],
  templateUrl: './business-unit-list.html',
  styleUrl: './business-unit-list.css',
})
export class BusinessUnitList {
  businessUnits = signal<BusinessUnit[]>([]);
  filteredBusinessUnits = signal<BusinessUnit[]>([]);
  loading = signal(true);
  reload$ = new Subject<boolean>();
  private destroyRef = inject(DestroyRef);

  @ViewChild('myDialog') dialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('newDialog') newDialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('alertDialog') alertDialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('alertStatusDialog') alertStatusDialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('errorDialog') errorDialog!: ElementRef<HTMLDialogElement>;

  editableBusinessUnit: BusinessUnit|null = null
  controlName = '';
  initialName = '';
  filterName = '';
  isVisible = signal(true);
  newBusinessUnit : BusinessUnit = {
    id: 0,
    code: '',
    active: true,
    name: ''
  };

  errorMessage = 'Nessun errore.';
  touched = false;
  alertTitle = '';
  selectedBusinessUnit: BusinessUnit|null = {
    id: 0,
    code: '',
    active: true,
    name: ''
  };

  // Settaggio della businessUnit
  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef){
    const subscription = this.apiService.getBusinessUnits().subscribe({
      next: (types) => {
        this.businessUnits.set(types ?? []);
        this.filteredBusinessUnits.set(this.businessUnits());
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage = 'API error asset types' + err;
        this.onErrorOccur();
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
    this.editableBusinessUnit = businessUnit;
    if(this.editableBusinessUnit.active === false){
      this.editableBusinessUnit.active = true;
    }
    else{
      if(this.editableBusinessUnit.active === true){
        this.editableBusinessUnit.active = false;
      }
    }
    this.apiService. putBusinessActiveChangeById(this.editableBusinessUnit.code, this.editableBusinessUnit.active)
    .subscribe({
      next: (updatedAssetType) => {
        const updatedList = this.businessUnits().map(at => at.code === updatedAssetType.code ? updatedAssetType : at);
        this.businessUnits.set(updatedList);
        this.reloadDiv();
      },
      error: (err) => {
        this.errorMessage = 'Errore durante l\'aggiornamento dell\'attivazione della business unit: ' + err;
        this.onErrorOccur();
      }
    });
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
  onModify(){
    if(this.editableBusinessUnit !== null){
      let modifiedName = this.initialName.toLowerCase();
      modifiedName = modifiedName.charAt(0).toUpperCase() + modifiedName.slice(1);

      this.editableBusinessUnit!.name = modifiedName;
    }
  }
  onCloseDialog(){
    this.touched = false;
    const subscription = this.apiService.getBusinessUnits().subscribe({
      next: (types) => {
        this.businessUnits.set(types ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage = 'API error asset types' + err;
        this.onErrorOccur();
        this.businessUnits.set([]);
        this.loading.set(false);
      }
    })
    this.destroyRef.onDestroy(() => subscription.unsubscribe());

    this.reloadDiv();
    this.dialog.nativeElement.close();
  }
  onConfirmEdit(){
    if(this.editableBusinessUnit !== null){

      const puttableBusinessUnit = { 
        name: this.editableBusinessUnit.name
      };
      this.apiService.putBusinessUnitById(this.editableBusinessUnit?.code, puttableBusinessUnit)
      .subscribe({
        next: (updatedBusinessUnit) => {
          const updatedList = this.businessUnits().map(at => at.code === updatedBusinessUnit.code ? updatedBusinessUnit : at);
          this.businessUnits.set(updatedList);
          this.dialog.nativeElement.close();
          this.initialName = '';
          this.controlName = '';
          this.alertTitle = '';
          this.reloadDiv();
        },
        error: (err) => {
          this.errorMessage = 'Errore durante l\'aggiornamento della business unit: ' + err;
          this.onErrorOccur();
          this.dialog.nativeElement.close();
          this.initialName = '';
          this.alertTitle = '';
          this.controlName = '';
        }
      });
    }
  }
  isInvalid(): boolean {
    return !(this.initialName.length > 2 && this.initialName.trim() !== this.controlName);
  }
  get specifiedMessage(): string {
    if (this.initialName.length <= 2) {
      return 'Nome non valido. Deve essere almeno 2 caratteri';
    }
    return 'Nome non valido. Il nome inserito deve essere diverso da quello già presente';
  }
  specifiedError(): boolean {
    return this.initialName.length > 0 && this.isInvalid();
  }
  OnOpenNewDialog(){
    this.newDialog.nativeElement.showModal();
    this.initialName = '';
    this.alertTitle = 'Conferma la creazione di una nuova business unit?';
  }
  onAdd(){
    let cretaedName = this.initialName.toLowerCase();
    cretaedName = cretaedName.charAt(0).toUpperCase() + cretaedName.slice(1);

    this.newBusinessUnit!.name = cretaedName;
  }
  onCloseNewDialog(){
    this.touched = false;
    this.initialName = '';
    this.reloadDiv();

    this.newDialog.nativeElement.close();
  }
  onConfirmCreate(){
    const postableBusinessUnit = { 
      name: this.newBusinessUnit.name
    };
    if(this.controlRepeatedName(postableBusinessUnit.name.trim())){
      this.apiService.postBusinessUnit(postableBusinessUnit)
      .subscribe({
        next: (createdBusinessUnit) => {
          const updatedList = [...this.businessUnits(), createdBusinessUnit];
          this.businessUnits.set(updatedList);
          this.newDialog.nativeElement.close();
          this.initialName = '';
          this.alertTitle = '';
          this.cdr.detectChanges();
          this.reloadDiv();
        },
        error: (err) => {
          this.errorMessage = 'Errore durante la creazione della business unit: ' + err;
          this.onErrorOccur();
          this.newDialog.nativeElement.close();
          this.initialName = '';
          this.alertTitle = '';
        }
      })
    }
    else{
      this.errorMessage = 'Errore nella creazione della business unit, non si può usare lo stesso nome per più business'
      this.newDialog.nativeElement.close();
      this.onErrorOccur();
    }
  }
  reloadDiv() {
    this.isVisible.set(false);
    setTimeout(() => {
      this.isVisible.set(true);
      this.reload$.next(true);
    }, 0);
  }
  controlRepeatedName(postableBusinessUnitName: string){
    if(this.businessUnits().find(unit => (unit.name === postableBusinessUnitName))){
      return false;
    }
    else{ return true; }
  }
  onAlertDialogOpen(){
    this.alertDialog.nativeElement.showModal();
  }
 onAlertDialogClose(){
    this.alertDialog.nativeElement.close();
    this.alertStatusDialog.nativeElement.close();
    this.alertTitle = '';
    this.selectedBusinessUnit = null;
  }
  onAlertChangeStatus(businessUnit: BusinessUnit){
    this.selectedBusinessUnit = businessUnit;
    console.log(this.selectedBusinessUnit.name);
    this.alertTitle = 'Conferma il cambiamento di status di '+ businessUnit.name +'?'
    this.alertStatusDialog.nativeElement.showModal();
  }
  onChoosingPath(){
    if(this.alertTitle === 'Conferma la creazione di una nuova business unit?'){
      this.onConfirmCreate();
    }
    else{
      if(this.alertTitle === 'Conferma la modifica di questa Business unit?'){
        this.onConfirmEdit();
      }
      else{
        if(this.alertTitle === 'Conferma il cambiamento di status di '+ this.selectedBusinessUnit!.name +'?'){
          this.changeStatus(this.selectedBusinessUnit!);
        }
        else{
          this.errorMessage = 'errore nella conferma';
          this.onErrorOccur();
        }
      }
    }
    this.alertDialog.nativeElement.close();
    this.alertStatusDialog.nativeElement.close();
  }
  onErrorOccur(){
    this.errorDialog.nativeElement.showModal();
  }
  onErrorWindowsClose(){
    this.errorDialog.nativeElement.close();
  }
}
