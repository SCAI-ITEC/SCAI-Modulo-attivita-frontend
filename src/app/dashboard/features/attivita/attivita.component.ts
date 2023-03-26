import { Component, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { combineLatest, merge, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { Dettaglio, UtentiAnagrafica } from 'src/app/api/stato-avanzamento/models';
import { ToastService } from 'src/app/services/toast.service';
import { InputComponent } from 'src/app/shared/components/input/input.component';
import { jsonCopy } from 'src/app/utils/json';
import { StatoAvanzamentoWrapService } from '../stato-avanzamento/services/stato-avanzamento-wrap.service';
import { AttivitaCreazioneModificaDialog } from './dialogs/attivita-creazione-modifica.dialog';
import { EliminazioneDialog } from './dialogs/eliminazione.dialog';
import { Commessa, CommessaSearchDto } from './models/attivita.models';
import { AttivitaService } from './services/attivita.service';

@Component({
  selector: 'app-attivita',
  templateUrl: './attivita.component.html',
  styleUrls: ['./attivita.component.css']
})
export class AttivitaComponent {

  @ViewChild("clienteDirettoAutocomplete") clienteDirettoAutocomplete!: InputComponent;
  @ViewChild("clienteFinaleAutocomplete") clienteFinaleAutocomplete!: InputComponent;
  @ViewChild("commessaAutocomplete") commessaAutocomplete!: InputComponent;
  @ViewChild("pmAutocomplete") pmAutocomplete!: InputComponent;
  @ViewChild("bmAutocomplete") bmAutocomplete!: InputComponent;

  destroy$ = new Subject<void>();
  searchClick$ = new Subject<void>();
  refresh$ = new Subject<void>();
  isLoading = false;

  clienteDirettoCtrl = new FormControl<Dettaglio | null>(null);
  get idClienteDiretto() {
    return this.clienteDirettoCtrl.value?.id;
  }
  clientiDiretti: Dettaglio[] = [];
  clienteFormatter = (c: Dettaglio) => c.descrizione;
  clienteFilter = (term: string, c: Dettaglio) =>
    (c.descrizione as string).toLowerCase().includes(term.toLowerCase());

  clienteFinaleCtrl = new FormControl<Dettaglio | null>(null);
  get idClienteFinale() {
    return this.clienteFinaleCtrl.value?.id;
  }
  clientiFinali: Dettaglio[] = [];

  commessaCtrl = new FormControl<Commessa | null>(null);
  get idCommessa() {
    return this.commessaCtrl.value?.id;
  }
  get codiceCommessa() {
    return this.commessaCtrl.value?.codice;
  }
  commesse: Commessa[] = [];
  commesseFormatter = (sc: Commessa) => sc?.codice + ' ' + sc?.descrizione;
  commesseFilter = (term: string, sc: Commessa) =>
    (sc?.codice + ' ' + sc?.descrizione).toLowerCase().includes(term.toLowerCase());

  descrizioneCtrl = new FormControl<string | null>(null);

  tipoAttivitaCtrl = new FormControl<number | null>(null);
  get tipoAttivita() {
    return this.tipoAttivitaCtrl.value;
  }
  tipiAttivita = [
    { text: 'Tutti', value: null },
    { text: 'Opportunità', _descr: "optn", value: 1 },
    { text: 'Commessa interna', _descr: "cmint", value: 2 }
  ];

  statoCtrl = new FormControl<string | null>('true'); // backend wants a string "true" or "false"
  stati = [
    { text: 'Tutti', value: null },
    { text: 'Valido', value: 'true' },
    { text: 'Invalido', value: 'false' },
  ];

  pmCtrl = new FormControl<UtentiAnagrafica | null>(null);
  get idPm() {
    return this.pmCtrl.value?.idUtente;
  }
  pmList: UtentiAnagrafica[] = [];
  pmFormatter = (pm: UtentiAnagrafica) => pm.cognome + ' ' + pm.nome;
  pmFilter = (term: string, pm: UtentiAnagrafica) =>
    (pm.cognome + ' ' + pm.nome).toLowerCase().includes(term.toLowerCase());

  bmCtrl = new FormControl<UtentiAnagrafica | null>(null);
  get idBm() {
      return this.bmCtrl.value?.idUtente;
  }
  bmList: UtentiAnagrafica[] = [];

  commesseResults: CommessaSearchDto[] = [];

  constructor(
    private attivitaService: AttivitaService,
    private statoAvanzamentoWrap: StatoAvanzamentoWrapService,
    private modalService: NgbModal,
    private toaster: ToastService
  ) { }

  ngOnInit() {

    this.initializeAutocompleteValues();

    // Define of autocomplete handlers
    const onClienteSelect$ = () => combineLatest([
      this.statoAvanzamentoWrap
        .getUtenti$(
          true,
          false,
          undefined,
          this.idClienteDiretto,
          this.idCommessa
        ),
      this.statoAvanzamentoWrap
        .getUtenti$(
          false,
          true,
          undefined,
          this.idClienteDiretto,
          this.idCommessa
        ),
      this.attivitaService
        .getCommesseAutocomplete$({
          idCliente: this.idClienteDiretto,
          idProjectManager: this.idPm,
          idBusinessManager: this.idBm
        })
    ])
    .pipe(
      tap(([ pmList, bmList, commesse ]) => {
        this.pmList = pmList;
        this.bmList = bmList;
        this.commesse = commesse;
      })
    );

    const onCommessaSelect$ = () => combineLatest([
      this.statoAvanzamentoWrap
        .getUtenti$(
          true,
          false,
          undefined,
          this.idClienteDiretto,
          this.idCommessa
        ),
      this.statoAvanzamentoWrap
        .getUtenti$(
          false,
          true,
          undefined,
          this.idClienteDiretto,
          this.idCommessa
        ),
      this.statoAvanzamentoWrap
        .getClienti$(
          this.idPm,
          undefined,
          this.idBm,
          this.idCommessa
        ),
    ])
    .pipe(
      tap(([ pmList, bmList, clienti ]) => {
        this.pmList = pmList;
        this.bmList = bmList;
        this.clientiDiretti = clienti;
      })
    );

    const onPmSelect$ = () => combineLatest([
      this.statoAvanzamentoWrap
        .getClienti$(
          this.idPm,
          undefined,
          this.idBm,
          this.idCommessa
        ),
      this.attivitaService
        .getCommesseAutocomplete$({
          idCliente: this.idClienteDiretto,
          idProjectManager: this.idPm
        })
    ])
    .pipe(
      tap(([ clienti, commesse ]) => {
        this.commesse = commesse;
        this.clientiDiretti = clienti;
      })
    );

    const onBmSelect$ = () => combineLatest([
      this.statoAvanzamentoWrap
        .getClienti$(
          this.idPm,
          undefined,
          this.idBm,
          this.idCommessa
        ),
      this.attivitaService
        .getCommesseAutocomplete$({
          idCliente: this.idClienteDiretto,
          idProjectManager: this.idPm
        })
    ])
    .pipe(
      tap(([ clienti, commesse ]) => {
        this.commesse = commesse;
        this.clientiDiretti = clienti;
      })
    );

    // Assign autocomplete handler to its control
    this.clienteDirettoCtrl.valueChanges
      .pipe(switchMap(() => onClienteSelect$()))
      .subscribe();

    this.commessaCtrl.valueChanges
      .pipe(switchMap(() => onCommessaSelect$()))
      .subscribe();

    this.pmCtrl.valueChanges
      .pipe(switchMap(() => onPmSelect$()))
      .subscribe();

    this.bmCtrl.valueChanges
      .pipe(switchMap(() => onBmSelect$()))
      .subscribe();
    
    merge(this.searchClick$, this.refresh$)
      .pipe(
        takeUntil(this.destroy$),
        tap(() => this.isLoading = true),
        switchMap(() =>
          this.attivitaService
            .getAllCommesse$({
              idCliente: this.idClienteDiretto,
              idClienteFinale: this.idClienteFinale,
              codiceCommessa: this.codiceCommessa,
              idProjectManager: this.idPm,
              idBusinessManager: this.idBm,
              idFase: this.tipoAttivita as number,
              valido: this.statoCtrl.value as string
            })
        ),
        tap(commesseResults => {
          this.isLoading = false;
          this.commesseResults = commesseResults;
        })
      )
      .subscribe();

    // When adding a new commessa
    this.refresh$
      .subscribe(() =>
        this.initializeAutocompleteValues(false, true, false) // only refresh commesse
      );
  }

  ngOnDestroy() {
    this.destroy$.next();
  }

  initializeAutocompleteValues(
    refreshUtenti = true,
    refreshCommesse = true,
    refreshClienti = true
  ) {

    if (refreshUtenti) {

      this.statoAvanzamentoWrap
        .getUtenti$(true, false)
        .subscribe(pmList => this.pmList = pmList);

      this.statoAvanzamentoWrap
        .getUtenti$(false, true)
        .subscribe(bmList => this.bmList = bmList);
    }

    if (refreshCommesse)
      this.attivitaService
        .getCommesseAutocomplete$()
        .subscribe(commesse => this.commesse = commesse);

    if (refreshClienti)
      this.statoAvanzamentoWrap
        .getClienti$()
        .subscribe(clienti => {
          this.clientiDiretti = jsonCopy(clienti);
          this.clientiFinali = jsonCopy(clienti);
        });
  }

  resetControls() {

    // DO NOT emit otherwise they will call the backend 6 times...
    this.clienteDirettoCtrl.setValue(null, { emitEvent: false });
    this.clienteFinaleCtrl.setValue(null, { emitEvent: false });
    this.commessaCtrl.setValue(null, { emitEvent: false });
    this.pmCtrl.setValue(null, { emitEvent: false });
    this.bmCtrl.setValue(null, { emitEvent: false });

    // ...instead clear the input manually
    this.clienteDirettoAutocomplete._autocompleteChoice = null;
    this.clienteFinaleAutocomplete._autocompleteChoice = null;
    this.commessaAutocomplete._autocompleteChoice = null;
    this.pmAutocomplete._autocompleteChoice = null;
    this.bmAutocomplete._autocompleteChoice = null;

    this.initializeAutocompleteValues();

    this.statoCtrl.setValue('true');
    this.tipoAttivitaCtrl.setValue(null);
  }

  async create() {

    const modalRef = this.modalService
      .open(
        AttivitaCreazioneModificaDialog,
        {
          size: 'lg',
          centered: true,
          scrollable: true,
          modalDialogClass: 'app-tall-dialog'
        }
      );

    await modalRef.result;
    this.refresh$.next();
  }

  async update(commessa: CommessaSearchDto) {

    const modalRef = this.modalService
      .open(
        AttivitaCreazioneModificaDialog,
        {
          size: 'lg',
          centered: true,
          scrollable: true,
          modalDialogClass: 'app-tall-dialog'
        }
      );
    modalRef.componentInstance.idCommessaPadre = commessa.id;

    await modalRef.result;
    this.refresh$.next();
  }

  async delete(commessa: CommessaSearchDto) {

    const modalRef = this.modalService
      .open(
        EliminazioneDialog,
        {
          size: 'md',
          centered: true,
          scrollable: true
        }
      );
    modalRef.componentInstance.name = commessa.codiceCommessa;

    await modalRef.result;
    this.attivitaService
      .deleteCommessa(commessa.id)
      .subscribe(
        () => {
          const txt = "Commessa eliminata con successo!";
          this.toaster.show(txt, { classname: 'bg-success text-white' });
          this.refresh$.next();
        },
        (ex) => {
          this.toaster.show(ex.error, { classname: 'bg-danger text-white' });
        }
      );
  }
}