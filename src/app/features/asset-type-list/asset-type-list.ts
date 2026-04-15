import { ChangeDetectorRef, Component, computed, DestroyRef, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { AssetType } from '../../shared/services/asset-type.service';
import { ApiService } from '../../services/api';
import { FormsModule } from "@angular/forms";
import { Subject } from 'rxjs';
import { PaginationComponent } from "../../shared/components/pagination/pagination";
import { PopupMessageService } from '../../shared/services/popup-message.service';
import { ButtonComponent } from "../../shared/components/button/button";

@Component({
  selector: 'app-asset-type-list',
  imports: [FormsModule, PaginationComponent, ButtonComponent],
  templateUrl: './asset-type-list.html',
  styleUrl: './asset-type-list.css',
})
export class AssetTypeList {
  assetTypes = signal<AssetType[]>([]);
  editableAssetType: AssetType | null = null;
  filteredAssetType = signal<AssetType[]>([]);
  reload$ = new Subject<boolean>();
  // selectedAssetType: AssetType|null = null;

  initialName = '';
  filterName= '';
  controlName = '';

  HDCheck = false;
  filterHD = false;
  controlHD = false;

  RamCheck = false;
  filterRam = false;
  controlRam = false;

  disactiveHDandRam = false;
  // activateHDandRam = false;

  errorTimeout: any = null;
  specifiedError = signal(false);
  isVisible = signal(true);
  loading = signal(true);
  touched = false;

  alertTitle = '';
  private destroyRef = inject(DestroyRef);
  // errorMessage = 'Nessun Errore.';
  
  @ViewChild('myDialog') dialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('newDialog') newDialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('alertDialog') alertDialog!: ElementRef<HTMLDialogElement>;
  // @ViewChild('alertStatusDialog') alertStatusDialog!: ElementRef<HTMLDialogElement>;
  // @ViewChild('errorDialog') errorDialog!: ElementRef<HTMLDialogElement>;

  // Settaggio del assetTypes
  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef, private readonly popupMessageService: PopupMessageService){
    const subscription = this.apiService.getAssetTypes().subscribe({
      next: (types) => {
        this.assetTypes.set(types ?? []);
        this.filteredAssetType.set(this.assetTypes());
        this.loading.set(false);
      },
      error: (err) => {
        this.popupMessageService.error('Errore con l\'API dell\'asset type');
        console.error('errore API asset type', err);
        this.assetTypes.set([]);
        this.loading.set(false);
      }
    })
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }
  currentPage = signal(1);
  itemsPerPage = signal(5);

  // ricalcolo e aggiorno automaticamente dopo ogni cambiamento
  totalPages = computed(() => {
    return Math.ceil(this.filteredAssetType().length / this.itemsPerPage());
  });

  // si aggiorna automaticamente quando cambi pagina o aggiungi/rimuovi users
  paginatedAssetType = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return this.filteredAssetType().slice(start, end);
  });

  //creazione stringa display range.
  displayRange = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage() + 1;
    const end = Math.min(this.currentPage() * this.itemsPerPage(), this.filteredAssetType().length);
    return `Mostrando ${start}-${end} di ${this.filteredAssetType().length}`;
  });
  goToPage(page: number): void {
    this.currentPage.set(page);
  }

  // Cambia lo status della business unit rendendola attiva o disattiva
  changeStatus(assetType: AssetType){
    this.editableAssetType = assetType;

    if(this.editableAssetType.active === false){
      this.editableAssetType.active = true;
    }
    else{
      if(this.editableAssetType.active === true){
        this.editableAssetType.active = false;
      }
    }
    this.apiService.putAssetActiveChangeById(this.editableAssetType.code, this.editableAssetType.active)
    .subscribe({
      next: (updatedAssetType) => {
        console.log(updatedAssetType);
        const updatedList = this.assetTypes().map(at => at.code === updatedAssetType.code ? updatedAssetType : at);
        this.assetTypes.set(updatedList);
        this.reloadDiv();
      },
      error: (err) => {
        this.popupMessageService.error('Errore durante l\'aggiornamento dell\'attivazione dell\'asset type');
        console.error('Errore attivazione asset type:', err);
      }
    });
  }

  // Diverse funzioni che si attivano prima durante o dopo la modifica di un tipo
  OnOpenDialog(assetType: AssetType){
    this.editableAssetType = assetType;
    this.controlName = assetType.name;
    this.controlHD = assetType.hardDisk;
    this.controlRam = assetType.ram;

    this.initialName = assetType.name;
    this.HDCheck = assetType.hardDisk;
    this.RamCheck = assetType.ram;

    this.dialog.nativeElement.showModal();
    this.alertTitle = 'Conferma la modifica di questo asset type?';
  }

  onConfirmEdit(){
    if(this.editableAssetType !== null){
      let modifiedName = this.initialName.toLowerCase();
      modifiedName = modifiedName.charAt(0).toUpperCase() + modifiedName.slice(1);

      this.editableAssetType.name = modifiedName;
      this.editableAssetType.hardDisk = this.HDCheck;
      this.editableAssetType.ram = this.RamCheck;

      const puttableAssetType = { 
        name: modifiedName,
        hardDisk: this.editableAssetType.hardDisk, 
        ram: this.editableAssetType.ram 
      };
 
      this.apiService.putAssetTypeById(this.editableAssetType?.code, puttableAssetType)
      .subscribe({
        next: (updatedAssetType) => {
          const updatedList = this.assetTypes().map(at => at.code === updatedAssetType.code ? updatedAssetType : at);
          this.assetTypes.set(updatedList);

          this.filteredAssetType.set(
            this.filteredAssetType().map(at => 
              at.code === updatedAssetType.code ? updatedAssetType : at
            )
          );

          this.popupMessageService.success('Asset type aggiornato con successo');
          this.reloadDiv();

          this.alertTitle = '';
          this.controlName = '';
          this.controlHD = false;
          this.controlRam = false;
          this.dialog.nativeElement.close();
        },
        error: (err) => {
          this.popupMessageService.error('Errore durante l\'aggiornamento del tipo di asset');
          console.error('Errore aggiornamento asset type:', err);
          this.alertTitle = '';
          this.controlName = '';
          this.controlHD = false;
          this.controlRam = false;
          this.dialog.nativeElement.close();
        }
      });
    }
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

  // funzione che filtra la lista di asset type
  onFilter() {
    let filtered = this.assetTypes();

    if (this.filterName !== '') {
      const searchName = this.filterName.toLowerCase();
      filtered = filtered.filter(asset =>
        asset.name.toLowerCase().includes(searchName)
      );
    }

    // filtra solo quelli con entrambi
    // if (this.activateHDandRam) {
    //   filtered = filtered.filter(a => a.hardDisk && a.ram);
    // }

    //filtra solo quando nè hard disk nè ram sono presenti
    if (this.disactiveHDandRam) {
      console.log(filtered);
      filtered = filtered.filter(a => {
        return !a.hardDisk && !a.ram;
      });
    }

    //filtra le singole opzioni di hard disk e ram
    else{
      if (this.filterHD) filtered = filtered.filter(a => a.hardDisk);
      if (this.filterRam) filtered = filtered.filter(a => a.ram);
    }

    console.log(filtered);
    this.filteredAssetType.set(filtered);
    this.currentPage.set(1);
  }

// Deseleziona tutte le altre checkbox
onDisactiveChange() {
  if (this.disactiveHDandRam) {
    this.filterHD = false;
    this.filterRam = false;
    // this.activateHDandRam = false;
  }
  this.onFilter();
}

onHDorRamChange() {

  // Se si attiva HD o Ram, disattiva "disattiva HD e Ram"
  if (this.filterHD || this.filterRam) {
    this.disactiveHDandRam = false;
    // this.activateHDandRam = false;
  }

  // Se entrambi selezionati disattivali e attiva l'apposito
  // setTimeout(() => {
  //   if (this.filterHD && this.filterRam) {
  //     this.activateHDandRam = true;
  //     this.filterHD = false;
  //     this.filterRam = false;
  //   } else {
  //     this.activateHDandRam = false;
  //   }
  //   this.onFilter();
  // }, 0);
  this.onFilter();
}

// disattiva tutte le altre checkbox quando attivo "attiva hard disk e ram"
// onActivateBothChange() {
//   if (this.activateHDandRam) {
//     this.filterHD = false;
//     this.filterRam = false;
//     this.disactiveHDandRam = false;
//   }
//   this.onFilter();
// }

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

    this.alertTitle = 'Conferma la creazione di un nuovo asset Type?';
  }

  // onAdd(){
  //   let createdName = this.initialName.toLowerCase();
  //   createdName = createdName.charAt(0).toUpperCase() + createdName.slice(1);

  //   this.newAssetType.name = createdName;
  //   this.newAssetType.hardDisk = this.HDCheck;
  //   this.newAssetType.ram = this.RamCheck;
  // }

  onConfirmCreate(){
    let createdName = this.initialName.toLowerCase();
    createdName = createdName.charAt(0).toUpperCase() + createdName.slice(1);

    const postableAssetType = { 
      name: createdName,
      hardDisk: this.HDCheck,
      ram: this.RamCheck
    };
    this.apiService.postAssetType(postableAssetType)
    .subscribe({
      next: (createdAssetType) => {
        const updatedList = [...this.assetTypes(), createdAssetType];
        this.assetTypes.set(updatedList);

        this.filteredAssetType.set([...this.filteredAssetType(), createdAssetType]);
        // this.onFilter();

        this.initialName = '';
        this.HDCheck = false;
        this.RamCheck = false;
        this.alertTitle = '';

        this.popupMessageService.success('Asset type creato con successo');
        this.newDialog.nativeElement.close();
        this.reloadDiv();
      },
      error: (err) => {
        this.popupMessageService.error('Errore durante la creazione del tipo di asset');
        console.error('Errore creazione asset type:', err);

        this.alertTitle = '';
        this.newDialog.nativeElement.close();
      }
    });
  }
  onCloseNewDialog(){
    this.touched = false;
    this.initialName = '';
    this.HDCheck = false;
    this.RamCheck = false;
    this.alertTitle = '';
    
    this.newDialog.nativeElement.close();
  }
  onNewDialogBackdropClick(event: MouseEvent): void {
    this.onCloseNewDialog();
  }

  // controllo che vengano messe le giuste credenziali
  isInvalid(): boolean {
    return !(this.initialName.length >= 2 && (
      this.controlRepeatedName(this.initialName.trim()) ||
      this.HDCheck !== this.controlHD ||
      this.RamCheck !== this.controlRam
    ));
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
  controlRepeatedName(assetTypeName: string){
    if(this.assetTypes().find(asset => (
      asset.name !== null &&
      asset.name.toLowerCase() === assetTypeName.toLowerCase() &&
      asset.name.toLowerCase() !== this.controlName.toLowerCase()
    ))){
      return false;
    }
    else{ return true; }
  }
  
  //creazione di dialogi di avvertenza
  onAlertDialogOpen(){
    this.alertDialog.nativeElement.showModal();
  }
  onAlertDialogClose(){
    // this.selectedAssetType = null;
    this.alertDialog.nativeElement.close();
    // this.alertStatusDialog.nativeElement.close();
  }
  // onAlertChangeStatus(assetType: AssetType){
  //   this.selectedAssetType = assetType;
  //   this.alertTitle = 'Conferma il cambiamento di status di '+ assetType.name +'?'
  //   this.alertStatusDialog.nativeElement.showModal()
  // }
  onChoosingPath(){
    if(this.alertTitle === 'Conferma la creazione di un nuovo asset Type?'){
      this.onConfirmCreate();
    }
    else{
      if(this.alertTitle === 'Conferma la modifica di questo asset type?'){
        this.onConfirmEdit();
      }
      else{this.popupMessageService.error('Errore nella conferma');}
    }
    this.alertDialog.nativeElement.close();
    // this.alertStatusDialog.nativeElement.close();
  }

  // //creazione di dialogo di errore
  // onErrorOccur(){
  //   this.errorDialog.nativeElement.showModal();
  // }
  // onErrorWindowsClose(){
  //   this.errorDialog.nativeElement.close();
  //   this.errorMessage = 'Nessun Errore.';
  // }
}