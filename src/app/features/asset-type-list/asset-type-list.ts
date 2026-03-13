import { ChangeDetectorRef, Component, DestroyRef, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { AssetType } from '../../shared/services/asset-type.service';
import { ApiService } from '../../services/api';
import { FormsModule } from "@angular/forms";
import { Subject } from 'rxjs';

//TODO creare un onCloseDialog che ricarica la lista dei tipi senza dover usare una get request

@Component({
  selector: 'app-asset-type-list',
  imports: [FormsModule],
  templateUrl: './asset-type-list.html',
  styleUrl: './asset-type-list.css',
})
export class AssetTypeList {
  assetTypes = signal<AssetType[]>([]);
  editableAssetType: AssetType | null = null;
  reload$ = new Subject<boolean>();
  newAssetType: AssetType = {
    id: 0,
    active: true,
    name: '',
    code: '',
    hardDisk: false,
    ram: false
  };

  initialName = '';
  HDCheck = false;
  RamCheck = false;
  isVisible = signal(true);
  loading = signal(true);
  private destroyRef = inject(DestroyRef);
  
  @ViewChild('myDialog') dialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('newDialog') newDialog!: ElementRef<HTMLDialogElement>;
  // Settaggio del assetTypes
  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef){
    const subscription = this.apiService.getAssetTypes().subscribe({
      next: (types) => {
        this.assetTypes.set(types ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('API error asset types', err);
        this.assetTypes.set([]);
        this.loading.set(false);
      }
    })
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }
  // Cambia lo status dell asset rendendolo attivo o disattivo
  changeStatus(assetType: AssetType){
    this.editableAssetType = assetType;
    const confirmed = window.confirm('Conferma cambiamento?');
    if(confirmed){
      if(this.editableAssetType.active === false){
      this.editableAssetType.active = true;
      }
      else{
        if(this.editableAssetType.active === true){
        this.editableAssetType.active = false;
        }
      }
    }
    this.apiService. putAssetActiveChangeById(this.editableAssetType.code, this.editableAssetType.active)
    .subscribe({
      next: (updatedAssetType) => {
        const updatedList = this.assetTypes().map(at => at.code === updatedAssetType.code ? updatedAssetType : at);
        this.assetTypes.set(updatedList);
        this.reloadDiv();
      },
      error: (err) => {
        console.error('Errore durante l\'aggiornamento dell\'attivazione del tipo di asset: ', err);
      }
    });
    
  }
  // Diverse funzioni che si attivano prima durante o dopo la modifica di un tipo
  OnOpenDialog(assetType: AssetType){
    this.editableAssetType = assetType;
    this.initialName = assetType.name;
    this.HDCheck = assetType.hardDisk;
    this.RamCheck = assetType.ram;

    this.dialog.nativeElement.showModal();
  }
  onModify(){
    if(this.editableAssetType !== null){
      let modifiedName = this.initialName.toLowerCase();
      modifiedName = modifiedName.charAt(0).toUpperCase() + modifiedName.slice(1);

      this.editableAssetType.name = modifiedName;
      this.editableAssetType.hardDisk = this.HDCheck;
      this.editableAssetType.ram = this.RamCheck;
    }
  }
  onConfirmEdit(){
    const confirmed = window.confirm('Conferma modifica?');

    if(this.editableAssetType !== null && confirmed){
      const puttableAssetType = { 
        name: this.editableAssetType.name, 
        hardDisk: this.editableAssetType.hardDisk, 
        ram: this.editableAssetType.ram 
      };
      this.apiService.putAssetTypeById(this.editableAssetType?.code, puttableAssetType)
      .subscribe({
        next: (updatedAssetType) => {
          const updatedList = this.assetTypes().map(at => at.code === updatedAssetType.code ? updatedAssetType : at);
          this.assetTypes.set(updatedList);
          this.dialog.nativeElement.close();
          this.reloadDiv();
        },
        error: (err) => {
          console.error('Errore durante l\'aggiornamento del tipo di asset: ', err);
          this.dialog.nativeElement.close();
        }
      });
    }
  }
  onCloseDialog(){
    const subscription = this.apiService.getAssetTypes().subscribe({
      next: (types) => {
        this.assetTypes.set(types ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('API error asset types', err);
        this.assetTypes.set([]);
        this.loading.set(false);
      }
    })
    this.destroyRef.onDestroy(() => subscription.unsubscribe());

    this.reloadDiv();
    this.dialog.nativeElement.close();
  }
  // Ricarica della tabella dei tipi per rendere subito visibile i cambiamenti fatti
  reloadDiv() {
    this.isVisible.set(false);
    setTimeout(() => {
      this.isVisible.set(true);
      this.reload$.next(true);
    }, 0);
  }
  // Diverse funzioni che si attivano prima durante o dopo la creazione di un tipo
  OnOpenNewDialog(){
    this.newDialog.nativeElement.showModal();
  
    this.initialName = '';
    this.HDCheck = false;
    this.RamCheck = false;
  }
  onAdd(){
    let createdName = this.initialName.toLowerCase();
      createdName = createdName.charAt(0).toUpperCase() + createdName.slice(1);

    this.newAssetType.name = createdName;
    this.newAssetType.hardDisk = this.HDCheck;
    this.newAssetType.ram = this.RamCheck;
  }
  onConfirmCreate(){
    const confirmed = window.confirm('Conferma creazione?');
    if(confirmed){
      const postableAssetType = { 
        name: this.newAssetType.name,
        hardDisk: this.newAssetType.hardDisk,
        ram: this.newAssetType.ram
      };
      this.apiService.postAssetType(postableAssetType)
      .subscribe({
        next: (createdAssetType) => {
          const updatedList = [...this.assetTypes(), createdAssetType];
          this.assetTypes.set(updatedList);
          this.newDialog.nativeElement.close();
          this.cdr.detectChanges();
          this.reloadDiv();
        },
        error: (err) => {
          console.error('Errore durante la creazione del tipo di asset: ', err);
          this.newDialog.nativeElement.close();
        }
      })
    }
  }
  onCloseNewDialog(){
    this.newDialog.nativeElement.close();
    this.initialName = '';
    this.HDCheck = false;
    this.RamCheck = false;
  }
  isInvalid(){
    if(this.initialName.length > 2 && this.initialName.match(/^[a-zA-Z]+$/)){
        return false;
      }
    else{ return true; }
  }
}