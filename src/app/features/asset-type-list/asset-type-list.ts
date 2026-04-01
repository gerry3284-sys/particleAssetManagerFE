import { ChangeDetectorRef, Component, computed, DestroyRef, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { AssetType } from '../../shared/services/asset-type.service';
import { ApiService } from '../../services/api';
import { FormsModule } from "@angular/forms";
import { Subject } from 'rxjs';
import { PaginationComponent } from "../../shared/components/pagination/pagination";
import { ButtonComponent } from '../../shared/components/button/button';

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
  newAssetType: AssetType = {
    id: 0,
    active: true,
    name: '',
    code: '',
    hardDisk: false,
    ram: false
  };

  initialName = '';
  filterName= '';
  controlName = '';
  HDCheck = false;
  filterHD = false;
  RamCheck = false;
  filterRam = false;
  disactiveHDandRam = false;
  activateHDandRam = false;

  isVisible = signal(true);
  loading = signal(true);
  touched = false;

  alertTitle = '';
  private destroyRef = inject(DestroyRef);
  errorMessage = 'Nessun Errore.';
  
  @ViewChild('myDialog') dialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('newDialog') newDialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('alertDialog') alertDialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('errorDialog') errorDialog!: ElementRef<HTMLDialogElement>;

  // Settaggio del assetTypes
  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef){
    const subscription = this.apiService.getAssetTypes().subscribe({
      next: (types) => {
        this.assetTypes.set(types ?? []);
        this.filteredAssetType.set(this.assetTypes())
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage = 'Errore con l\'API dell\'asset type: ' + err;
        this.onErrorOccur();
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

  // Diverse funzioni che si attivano prima durante o dopo la modifica di un tipo
  OnOpenDialog(assetType: AssetType){
    this.editableAssetType = assetType;
    this.initialName = assetType.name;
    this.controlName = assetType.name;
    this.HDCheck = assetType.hardDisk;
    this.RamCheck = assetType.ram;

    this.dialog.nativeElement.showModal();
    this.alertTitle = 'Conferma la modifica di questo asset type?';
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
    if(this.editableAssetType !== null){
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
          this.alertTitle = '';
          this.controlName = '';
        },
        error: (err) => {
          this.errorMessage = 'Errore durante l\'aggiornamento del tipo di asset: ' + err;
          this.onErrorOccur();
          this.dialog.nativeElement.close();
          this.alertDialog.nativeElement.close();
          this.alertTitle = '';
          this.controlName = '';
        }
      });
    }
  }
  onCloseDialog(){
    this.touched = false;
    const subscription = this.apiService.getAssetTypes().subscribe({
      next: (types) => {
        this.assetTypes.set(types ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage = 'API error asset types: ' + err;
        this.onErrorOccur();
        this.assetTypes.set([]);
        this.loading.set(false);
      }
    })
    this.destroyRef.onDestroy(() => subscription.unsubscribe());

    this.reloadDiv();
    this.dialog.nativeElement.close();
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
  if (this.activateHDandRam) {
    filtered = filtered.filter(a => a.hardDisk && a.ram);
  }

  //filtra solo quando nè hard disk nè ram sono presenti
  else if (this.disactiveHDandRam) {
      filtered = filtered.filter(a => !a.hardDisk && !a.ram);
  }

  //filtra le singole opzioni di hard disk e ram
  else{
    if (this.filterHD) filtered = filtered.filter(a => a.hardDisk);
    if (this.filterRam) filtered = filtered.filter(a => a.ram);
  }

  this.filteredAssetType.set(filtered);
  this.currentPage.set(1);
}

// Deseleziona tutte le altre checkbox
onDisactiveChange() {
  if (this.disactiveHDandRam) {
    this.filterHD = false;
    this.filterRam = false;
    this.activateHDandRam = false;
  }
  this.onFilter();
}

onHDorRamChange() {

  // Se si attiva HD o Ram, disattiva "disattiva HD e Ram"
  if (this.filterHD || this.filterRam) {
    this.disactiveHDandRam = false;
  }

  // Se entrambi selezionati disattivali e attiva l'apposito
  if (this.filterHD && this.filterRam) {
    this.activateHDandRam = true;
    this.filterHD = false;
    this.filterRam = false;
  }
  this.onFilter();
}

// disattiva tutte le altre checkbox quando attivo "attiva hard disk e ram"
onActivateBothChange() {
  if (this.activateHDandRam) {
    this.filterHD = false;
    this.filterRam = false;
    this.disactiveHDandRam = false;
  }
  this.onFilter();
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

    this.alertTitle = 'Conferma la creazione di un nuovo asset Type?';
  }
  onAdd(){
    let createdName = this.initialName.toLowerCase();
      createdName = createdName.charAt(0).toUpperCase() + createdName.slice(1);

    this.newAssetType.name = createdName;
    this.newAssetType.hardDisk = this.HDCheck;
    this.newAssetType.ram = this.RamCheck;
  }
  onConfirmCreate(){
    const postableAssetType = { 
      name: this.newAssetType.name,
      hardDisk: this.newAssetType.hardDisk,
      ram: this.newAssetType.ram
    };
    if(this.controlRepeatedName(postableAssetType.name.trim())){
      this.apiService.postAssetType(postableAssetType)
      .subscribe({
        next: (createdAssetType) => {
          const updatedList = [...this.assetTypes(), createdAssetType];
          this.assetTypes.set(updatedList);

          this.newDialog.nativeElement.close();
          this.cdr.detectChanges();
          this.reloadDiv();
          this.alertTitle = '';
        },
        error: (err) => {
          this.errorMessage = 'Errore durante la creazione del tipo di asset: ' + err;
          this.onErrorOccur();

          this.newDialog.nativeElement.close();
          this.alertTitle = '';
        }
      })
    }
    else{
      this.errorMessage = 'Errore nella creazione del tipo di asset, non si può usare lo stesso nome per più asset'
      this.newDialog.nativeElement.close();
      this.onErrorOccur();
    }
  }
  onCloseNewDialog(){
    this.touched = false;
    this.newDialog.nativeElement.close();
    this.initialName = '';
    this.HDCheck = false;
    this.RamCheck = false;
  }

  // controllo che vengano messe le giuste credenziali
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
  controlRepeatedName(postableAssetTypeName: string){
    if(this.assetTypes().find(asset => (asset.name === postableAssetTypeName))){
      return false;
    }
    else{ return true; }
  }
  
  //creazione di dialogi di avvertenza
  onAlertDialogOpen(){
    this.alertDialog.nativeElement.showModal();
  }
  onAlertDialogClose(){
    this.alertDialog.nativeElement.close();
    this.alertTitle = '';
  }
  onChoosingPath(){
    if(this.alertTitle === 'Conferma la creazione di un nuovo asset Type?'){
      this.onConfirmCreate();
    }
    else{
      if(this.alertTitle === 'Conferma la modifica di questo asset type?'){
        this.onConfirmEdit();
      }
      else{
        this.errorMessage = 'errore nella conferma';
        this.onErrorOccur();
      }
    }
    this.alertDialog.nativeElement.close();
  }

  //creazione di dialogo di errore
  onErrorOccur(){
    this.errorDialog.nativeElement.showModal();
  }
  onErrorWindowsClose(){
    this.errorDialog.nativeElement.close();
  }
}