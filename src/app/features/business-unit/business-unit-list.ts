import { ChangeDetectorRef, Component, computed, DestroyRef, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { ApiService } from '../../services/api';
import { BusinessUnit } from '../../shared/services/business-unit.service';
import { FormsModule } from "@angular/forms";
import { Subject } from 'rxjs';

@Component({
  selector: 'app-business-unit-list',
  imports: [FormsModule],
  templateUrl: './business-unit-list.html',
  styleUrl: './business-unit-list.css',
})
export class BusinessUnitList {
  businessUnits = signal<BusinessUnit[]>([]);
  loading = signal(true);
  reload$ = new Subject<boolean>();
  private destroyRef = inject(DestroyRef);

  @ViewChild('myDialog') dialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('newDialog') newDialog!: ElementRef<HTMLDialogElement>;

  editableBusinessUnit: BusinessUnit|null = null
  initialName = '';
  isVisible = signal(true);
  newBusinessUnit : BusinessUnit = {
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
        this.loading.set(false);
      },
      error: (err) => {
        console.error('API error asset types', err);
        this.businessUnits.set([]);
        this.loading.set(false);
      }
    })
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }
  // Cambia lo status della business unit rendendola attiva o disattiva
  changeStatus(businessUnit: BusinessUnit){
    this.editableBusinessUnit = businessUnit;
    const confirmed = window.confirm('Conferma cambiamento?');
    if(confirmed){
      if(this.editableBusinessUnit.active === false){
      this.editableBusinessUnit.active = true;
      }
      else{
        if(this.editableBusinessUnit.active === true){
        this.editableBusinessUnit.active = false;
        }
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
        console.error('Errore durante l\'aggiornamento dell\'attivazione della business unit: ', err);
      }
    });
  }
  // Diverse funzioni che si attivano prima durante o dopo la modifica di un tipo
  OnOpenDialog(businessUnit: BusinessUnit){
    this.editableBusinessUnit = businessUnit;
    this.initialName = businessUnit.name;
  
    this.dialog.nativeElement.showModal();
  }
  onModify(){
    if(this.editableBusinessUnit !== null){
      let modifiedName = this.initialName.toLowerCase();
      modifiedName = modifiedName.charAt(0).toUpperCase() + modifiedName.slice(1);

      this.editableBusinessUnit!.name = modifiedName;
    }
  }
  onCloseDialog(){
    const subscription = this.apiService.getBusinessUnits().subscribe({
      next: (types) => {
        this.businessUnits.set(types ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('API error asset types', err);
        this.businessUnits.set([]);
        this.loading.set(false);
      }
    })
    this.destroyRef.onDestroy(() => subscription.unsubscribe());

    this.reloadDiv();
    this.dialog.nativeElement.close();
  }
  onConfirmEdit(){
    const confirmed = window.confirm('Conferma modifica?');

    if(this.editableBusinessUnit !== null && confirmed){

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
          this.reloadDiv();
        },
        error: (err) => {
          console.error('Errore durante l\'aggiornamento della business unit: ', err);
          this.dialog.nativeElement.close();
        }
      });
    }
  }
  isInvalid(){
    if(this.initialName.length > 2 && this.initialName.match(/^[a-zA-Z]+$/)){
      return false;
    }
    else{ return true; }
  }
  OnOpenNewDialog(){
    this.newDialog.nativeElement.showModal();
    this.initialName = '';
  }
  onAdd(){
    let cretaedName = this.initialName.toLowerCase();
    cretaedName = cretaedName.charAt(0).toUpperCase() + cretaedName.slice(1);

    this.newBusinessUnit!.name = cretaedName;
  }
  onCloseNewDialog(){
    this.initialName = '';
    this.reloadDiv();

    this.newDialog.nativeElement.close();
  }
  onConfirmCreate(){
    const confirmed = window.confirm('Conferma creazione?');

    if(confirmed){
      const postableBusinessUnit = { 
        name: this.newBusinessUnit.name
      };
      this.apiService.postBusinessUnit(postableBusinessUnit)
      .subscribe({
        next: (createdBusinessUnit) => {
          const updatedList = [...this.businessUnits(), createdBusinessUnit];
          this.businessUnits.set(updatedList);
          this.newDialog.nativeElement.close();
          this.initialName = '';
          this.cdr.detectChanges();
          this.reloadDiv();
        },
        error: (err) => {
          console.error('Errore durante la creazione della business unit: ', err);
          this.newDialog.nativeElement.close();
        }
      })
    }
  }
  reloadDiv() {
    this.isVisible.set(false);
    setTimeout(() => {
      this.isVisible.set(true);
      this.reload$.next(true);
    }, 0);
  }
}
