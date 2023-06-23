import { Component, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { combineLatest, lastValueFrom, merge, startWith, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { Dettaglio, GetCommesseResponse, UtentiAnagrafica } from 'src/app/api/modulo-attivita/models';
import { ToastService } from 'src/app/services/toast.service';
import { InputComponent } from 'src/app/shared/components/input/input.component';
import { delayedScrollTo } from 'src/app/utils/dom';
import { CommessaCreazioneModifica } from './dialogs/commessa-creazione-modifica/commessa-creazione-modifica.component';
import { EliminazioneDialog } from './dialogs/eliminazione.dialog';
import { ROLES } from 'src/app/models/user';
import { MiscDataService } from '../commons/services/miscellaneous-data.service';
import { CommesseService } from 'src/app/api/modulo-attivita/services';
import { AuthService } from 'src/app/services/auth.service';

const today = new Date();
const [ currYear, currMonth, currDay ] = [ today.getFullYear(), today.getMonth() + 1, today.getDate() ];

interface Tab {
  id: number;
  codiceCommessa: string;
}

@Component({
  selector: 'app-attivita',
  templateUrl: './attivita.component.html',
  styleUrls: ['./attivita.component.css']
})
export class AttivitaComponent {

  ROLES = ROLES;

  @ViewChild("clienteAC") clienteAC!: InputComponent;
  @ViewChild("clienteFinaleAC") clienteFinaleAC!: InputComponent;
  @ViewChild("bmAC") bmAC!: InputComponent;
  @ViewChild("commessaAC") commessaAC!: InputComponent;

  destroy$ = new Subject<void>();
  searchClick$ = new Subject<void>();
  refresh$ = new Subject<void>();
  isLoading = false;

  activeTabId!: number;
  tabs: Tab[] = [];
  
  clienteFormatter = (c: Dettaglio) => c.descrizione;
  bmFormatter = (bm: UtentiAnagrafica) => bm.cognome + ' ' + bm.nome;
  commessaFormatter = (c: GetCommesseResponse) => c?.codiceCommessa + ' ' + c?.descrizione;
  
  clienti: Dettaglio[] = [];
  clientiFinali: Dettaglio[] = [];
  businessManagers: UtentiAnagrafica[] = [];
  commesse: GetCommesseResponse[] = [];
  tipiAttivita = [
    { text: 'Tutte', value: null },
    { text: 'Opportunità', _descr: "optn", value: 1 },
    { text: 'Commessa interna', _descr: "cmint", value: 2 }
  ];
  stati = [
    { text: 'Tutte', value: null },
    { text: 'Valida', value: 'true' },
    { text: 'Annullata', value: 'false' },
  ];
  
  init = false;
  commesseResults: GetCommesseResponse[] = [];

  form = new FormGroup({
    cliente: new FormControl<Dettaglio | null>(null),
    clienteFinale: new FormControl<Dettaglio | null>(null),
    businessManager: new FormControl<UtentiAnagrafica | null>(null),
    commessa: new FormControl<GetCommesseResponse | null>(null),
    idTipoAttivita: new FormControl<number | null>(null),
    stato: new FormControl<boolean | null>(null),
    inizio: new FormControl(),
    fine: new FormControl()
  });

  get idCli() {
    return this.form.controls["cliente"].value?.id;
  }
  get idCliFin() {
    return this.form.controls["clienteFinale"].value?.id;
  }
  get idBm() {
    return this.form.controls["businessManager"].value?.idUtente;
  }
  get idComm() {
    return this.form.controls["commessa"].value?.id;
  }
  get codComm() {
    return this.form.controls["commessa"].value?.codiceCommessa;
  }

  constructor(
    private authService: AuthService,
    private commesseService: CommesseService,
    private miscData: MiscDataService,
    private modalService: NgbModal,
    private toaster: ToastService
  ) { }

  async ngOnInit() {

    [
      this.clienti,
      this.businessManagers,
      this.commesse
    ] = await lastValueFrom(
      combineLatest([
        this.miscData.getClienti$(),
        this.miscData.getBusinessManagers$(),
        this.miscData.getCommessePadre$(),
      ])
    );

    this.clientiFinali = this.clienti;

    this.attachAutocompleteListeners();

    merge(this.searchClick$, this.refresh$)
      .pipe(
        startWith(null),
        takeUntil(this.destroy$),
        tap(() => this.isLoading = true),
        switchMap(() => {

          const { idTipoAttivita, stato, inizio, fine } = this.form.value;

          let Where = "idCommessaPadre = null";
          if (this.idCli)      Where += ` and cliente.id = ${this.idCli}`;
          if (this.idCliFin)   Where += ` and clienteFinale.id = ${this.idCliFin}`;
          if (this.idBm)       Where += ` and businessManager.id = ${this.idBm}`;
          if (this.codComm)    Where += ` and codiceCommessa = "${this.codComm}"`;
          if (idTipoAttivita)  Where += ` and tipoAttivita.id = ${idTipoAttivita}`;
          if (stato)           Where += ` and valido = ${stato}`;
          if (inizio)          Where += ` and dataInserimento >= "${inizio}"`;
          if (fine)            Where += ` and dataInserimento <= "${fine}"`;

          return this.commesseService
            .getCommesse({
              IdAzienda: this.authService.user.idAzienda,
              OrderBy: "id desc",
              Where
            })
        }),
        tap(commesseResults => {

          this.isLoading = false;
          this.commesseResults = commesseResults;

          if (!this.init) {
            delayedScrollTo("#tabella-commesse");
            this.init = true;
          }
        })
      )
      .subscribe();

    // When adding a new commessa refresh commesse autocomplete
    this.refresh$
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(async () =>
        this.commesse = await lastValueFrom(this.miscData.getCommesse$())
      );
  }

  ngOnDestroy() {
    this.destroy$.next();
  }

  attachAutocompleteListeners() {

    const getCommQuery = () =>
      this.commesseService.getCommesse({
        IdAzienda: this.authService.user.idAzienda,
        OrderBy: "id desc",
        Where: 'idCommessaPadre = null'
             + (this.idCli ? ' and cliente.id = '         + this.idCli : '')
             + (this.idBm  ? ' and businessManager.id = ' + this.idBm  : '')
      });
    
    const getBmReq = () =>
      this.miscData.getUtenti$({
        IsPm: false,
        IsBm: true,
        idCliente: this.idCli,
        idCommessa: this.idComm
      });

    const getCliReq = () =>
      this.miscData.getClienti$({
        idBusinessManager: this.idBm,
        idCommessa: this.idComm,
        totali: true
      });

    // Dynamic cross-field filtering
    this.form.controls["cliente"].valueChanges
      .pipe(
        switchMap(() =>
          combineLatest([ getBmReq(), getCommQuery() ])
        )
      )
      .subscribe(([ bms, commesse ]) => {
        this.businessManagers = bms;
        this.commesse = commesse;
      });

    this.form.controls["commessa"].valueChanges
      .pipe(
        switchMap(() =>
          combineLatest([  getBmReq(), getCliReq() ])
        )
      )
      .subscribe(([ bms, clienti ]) => {
        this.businessManagers = bms;
        this.clienti = clienti;
      });

    this.form.controls["businessManager"].valueChanges
      .pipe(
        switchMap(() =>
          combineLatest([ getCliReq(), getCommQuery() ])
        )
      )
      .subscribe(([ clienti, commesse ]) => {
        this.clienti = clienti;
        this.commesse = commesse;
      });
  }

  resetControls() {

    // DO NOT emit otherwise they will call the backend 6 times
    // (see attachAutocompleteListeners())...
    this.form.patchValue(
      {
        cliente: null,
        clienteFinale: null,
        businessManager: null,
        commessa: null,
        idTipoAttivita: null,
        stato: true
      },
      { emitEvent: false }
    );

    // ...instead clear the input manually
    this.clienteAC._autocompleteChoice = null;
    this.clienteFinaleAC._autocompleteChoice = null;
    this.commessaAC._autocompleteChoice = null;
    this.bmAC._autocompleteChoice = null;

    this.refresh$.next();
  }

  addTab(id: number, codiceCommessa: string) {

    const tabAlreadyExist = this.tabs.find(t => t.id === id);
    if (tabAlreadyExist) {
      this.activeTabId = id;
      delayedScrollTo("#commessa-" + id);
      return;
    }

    this.activeTabId = id;

    this.tabs.push({ id, codiceCommessa });

    delayedScrollTo("#commessa-" + id);
  }

  closeTab(toRemove: number, evt?: MouseEvent) {

    // Open the tab to the left
    const tabToRemoveIndex = this.tabs.findIndex(tab => tab.id === toRemove);
    if (this.activeTabId === toRemove) {
      if (tabToRemoveIndex === 0) {
        this.activeTabId = this.tabs[tabToRemoveIndex + 1]?.id; // right
      }
      else {
        this.activeTabId = this.tabs[tabToRemoveIndex - 1]?.id; // left
      }
    }

    // Remove tab from the array
		this.tabs = this.tabs.filter((tab) => tab.id !== toRemove);

    if (evt) {
      evt.preventDefault();
      evt.stopImmediatePropagation();
    }
	}

  async create() {

    const modalRef = this.modalService
      .open(
        CommessaCreazioneModifica,
        { size: "xl", centered: true }
      );

    const { idCommessa, codiceCommessa } = await modalRef.result;
    this.addTab(idCommessa, codiceCommessa);

    this.refresh$.next();
  }

  async update(commessa: GetCommesseResponse) {

    const modalRef = this.modalService
      .open(
        CommessaCreazioneModifica,
        { size: "xl", centered: true }
      );
    
    modalRef.componentInstance.idCommessa = commessa.id;

    await modalRef.result;

    this.refresh$.next();
  }

  async disableCommessa(commessa: GetCommesseResponse) {

    const modalRef = this.modalService
      .open(
        EliminazioneDialog,
        { size: 'md', centered: true }
      );
    
    modalRef.componentInstance.name = commessa.codiceCommessa;
    modalRef.componentInstance.message = "Stai eliminando definitivamente una commessa interna.";

    await modalRef.result;

    this.commesseService
      .postCommessa({ body: { id: commessa.id, valido: false }})
      .subscribe(
        () => {
          const txt = "Commessa disabilitata con successo!";
          this.toaster.show(txt, { classname: 'bg-success text-white' });

          this.closeTab(commessa.id!);

          this.refresh$.next();
        },
        (ex) => {
          this.toaster.show(ex.error, { classname: 'bg-danger text-white' });
        }
      );
  }

  async restoreCommessa(commessa: GetCommesseResponse) {
    this.commesseService
      .postCommessa({ body: { id: commessa.id, valido: true }})
      .subscribe(
        () => {
          const txt = "Commessa rirpistinata con successo!";
          this.toaster.show(txt, { classname: 'bg-success text-white' });
          this.refresh$.next();
        },
        (ex) => {
          this.toaster.show(ex.error, { classname: 'bg-danger text-white' });
        }
      );
  }
}
