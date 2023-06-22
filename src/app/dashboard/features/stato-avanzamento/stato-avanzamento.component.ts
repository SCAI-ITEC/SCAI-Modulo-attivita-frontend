import { Component, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { catchError, combineLatest, filter, map, of, Subject, switchMap, takeUntil, tap, throwError } from 'rxjs';
import { Dettaglio, DettaglioAvanzamento, EnumAvanzamento, EnumStatiChiusura, GetSottoCommesseAvanzamentoResponse, GetSottoCommessePerReferenteResponse, UtentiAnagrafica } from 'src/app/api/modulo-attivita/models';
import { StatoAvanzamentoWrapService } from 'src/app/dashboard/features/stato-avanzamento/services/stato-avanzamento-wrap.service';
import { GetAvanzamentoParam } from 'src/app/dashboard/features/stato-avanzamento/models/stato-avanzamento';
import { ToastService } from 'src/app/services/toast.service';
import { enforceMinMax } from 'src/app/utils/input';
import { ROLES } from 'src/app/models/user';
import { jsonCopy } from 'src/app/utils/json';
import { InputComponent } from 'src/app/shared/components/input/input.component';
import { MonthpickerStruct } from 'src/app/shared/components/monthpicker/monthpicker.component';
import { structToIso } from 'src/app/utils/date';
import { MiscDataService } from '../commons/services/miscellaneous-data.service';
import { AuthService } from 'src/app/services/auth.service';
import { intersection } from 'src/app/utils/array';
import { guid } from 'src/app/utils/uuid';

interface Tab {
  id: number;
  title: string;
  avanzamento: GetSottoCommesseAvanzamentoResponse[];
}

@Component({
  selector: 'app-stato-avanzamento',
  templateUrl: './stato-avanzamento.component.html',
  styleUrls: ['./stato-avanzamento.component.css']
})
export class StatoAvanzamentoComponent {

  EnumStatiChiusura = EnumStatiChiusura;
  ROLES = ROLES;
  intersection = intersection;
  guid = guid;

  @ViewChild("clienteAutocomplete") clienteAutocomplete!: InputComponent;
  @ViewChild("sottocommessaAutocomplete") sottocommessaAutocomplete!: InputComponent;
  @ViewChild("pmAutocomplete") pmAutocomplete!: InputComponent;
  @ViewChild("bmAutocomplete") bmAutocomplete!: InputComponent;

  destroy$ = new Subject<void>();
  searchClick$ = new Subject<void>();
  loading = false;

  activeTabId!: number;
  tabs: Tab[] | null = null;

  lastSearchFilter!: GetAvanzamentoParam;

  pmCtrl = new FormControl<UtentiAnagrafica | null>(null);
  get idPm() {
    return this.pmCtrl.value?.idUtente;
  }
  pmList: UtentiAnagrafica[] = [];
  pmFormatter = (pm: UtentiAnagrafica) => pm.cognome + ' ' + pm.nome;

  bmCtrl = new FormControl<UtentiAnagrafica | null>(null);
  get idBm() {
    return this.bmCtrl.value?.idUtente;
  }
  bmList: UtentiAnagrafica[] = [];

  sottocommessaCtrl = new FormControl<GetSottoCommessePerReferenteResponse | null>(null);
  get idSottocommessa() {
    return this.sottocommessaCtrl.value?.sottoCommessa?.id;
  }
  sottocommesse: GetSottoCommessePerReferenteResponse[] = [];
  sottocommessaFormatter = (sc: GetSottoCommessePerReferenteResponse) => {
    return sc.sottoCommessa?.codice + ' ' + sc.sottoCommessa?.descrizione;
  }

  clienteCtrl = new FormControl<Dettaglio | null>(null);
  get idCliente() {
    return this.clienteCtrl.value?.id;
  }
  clienti: Dettaglio[] = [];
  clienteFormatter = (c: Dettaglio) => c.descrizione;

  statoCtrl = new FormControl<number>(0);
  stati = [
    { text: 'Tutti', value: 0 },
    { text: 'Aperto', value: 1 },
    { text: 'Chiuso', value: 2 },
    { text: 'Vistato', value: 3 },
  ];

  statoAvanzamentoCtrl = new FormControl<string>("");
  statiAvanzamento = [["", "Tutti"], ...Object.entries(EnumAvanzamento)]
    .map(([value, text]) => ({text, value}));
  
  dataInizioCtrl = new FormControl();
  get dataInizio() {
    return this.dataInizioCtrl.value;
  }

  dataFineCtrl = new FormControl();
  get dataFine() {
    return this.dataFineCtrl.value;
  }

  now = new Date();
  meseCtrl = new FormControl<MonthpickerStruct>({ year: this.now.getFullYear(), month: this.now.getMonth() + 1 });
  get mese() {
    return this.meseCtrl.value;
  }

  constructor(
    public authService: AuthService,
    private miscData: MiscDataService,
    private statoAvanzamentoWrap: StatoAvanzamentoWrapService,
    private toastService: ToastService
  ) { }
  
  ngOnInit() {
    
    this.initializeAutocompleteValues();

    this.setupAutocompletes();

    this.searchClick$
      .pipe(
        takeUntil(this.destroy$),
        map(() => {

          const adminRolesIntersect = intersection(
            [
              ROLES.AMMINISTRATORE,
              ROLES.RESPONSABILE_COMMERCIALE,
              ROLES.SEGRETERIA,
              ROLES.CONTROLLER
            ],
            this.authService.user.roles
          );

          const isAdmin = adminRolesIntersect.length > 0;
          const isBm = this.authService.user.roles.includes(ROLES.BUSINESS_MANAGER);

          return {
            idReferente:
              (isAdmin || isBm)
                ? this.idPm
                : this.authService.user.idUtente,
            idBusinessManager:
              isAdmin
                ? this.idBm
                : isBm
                  ? this.authService.user.idUtente
                  : undefined,
            idSottoCommessa: this.idSottocommessa,
            idCliente: this.idCliente,
            stato: this.statoCtrl.value || undefined,
            avanzamento: this.statoAvanzamentoCtrl.value || undefined,
            dataInizio: this.dataInizio,
            dataFine: this.dataFine,
            mese: this.mese ? structToIso(this.mese) : undefined
          }
        }),
        tap(searchParam =>
          this.lastSearchFilter = jsonCopy(searchParam)
        ),
        filter(() => {
          let _confirm = true;
          if (this.hasUnsavedWork())
            _confirm = confirm("Hai del lavoro in sospeso, e rilanciando la ricerca potresti perderlo. Vuoi comunque continuare?");
          return _confirm;
        }),
        tap(() => this.loading = true),
        switchMap(searchParam =>
          this.statoAvanzamentoWrap
            .getAvanzamento$(searchParam)
            .pipe(
              catchError(() => {
                this.toastService.show("Non è stato possibile recuperare i dati. Contattare il supporto tecnico.", { classname: 'bg-danger text-light', delay: 10000 });
                return of([]);
              })
            )
        ),
        tap(avanzamento => {
          this.updateResults(avanzamento);
          this.loading = false;
        })
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.destroy$.next();
  }

  initializeAutocompleteValues() {

    this.miscData.getClienti$()
      .subscribe(clienti => this.clienti = clienti);

    this.miscData.getSottocommesse$()
      .subscribe(sottocommesse => this.sottocommesse = sottocommesse);

    this.miscData.getUtenti$({ IsPm: true, IsBm: false })
      .subscribe(pmList => this.pmList = pmList);

    this.miscData.getUtenti$({ IsPm: false, IsBm: true })
      .subscribe(bmList => this.bmList = bmList);
  }

  setupAutocompletes() {

    this.pmCtrl.valueChanges
      .pipe(
        switchMap(() =>
          combineLatest([
            this.miscData
              .getClienti$({
                idBusinessManager: this.idBm,
                idReferente: this.idPm,
                idSottoCommessa: this.idSottocommessa
              }),
            this.miscData
              .getSottocommesse$({
                idBusinessManager: this.idBm,
                idReferente: this.idPm,
                idCliente: this.idCliente
              })
          ])
        ),
        tap(([ clienti, sottocommesse ]) => {
          this.sottocommesse = sottocommesse;
          this.clienti = clienti;
        })
      )
      .subscribe();

    this.bmCtrl.valueChanges
      .pipe(
        switchMap(() =>
          combineLatest([
            this.miscData
              .getClienti$({
                idBusinessManager: this.idBm,
                idReferente: this.idPm,
                idSottoCommessa: this.idSottocommessa
              }),
            this.miscData
              .getSottocommesse$({
                idBusinessManager: this.idBm,
                idReferente: this.idPm,
                idCliente: this.idCliente
              })
          ])
        ),
        tap(([ clienti, sottocommesse ]) => {
          this.sottocommesse = sottocommesse;
          this.clienti = clienti;
        })
      )
      .subscribe();

    this.sottocommessaCtrl.valueChanges
      .pipe(
        switchMap(() =>
          combineLatest([
            this.miscData
              .getUtenti$({
                IsPm: true,
                IsBm: false,
                idSottoCommessa: this.idSottocommessa,
                idCliente: this.idCliente
              }),
            this.miscData
              .getUtenti$({
                IsPm: false,
                IsBm: true,
                idSottoCommessa: this.idSottocommessa,
                idCliente: this.idCliente
              }),
            this.miscData
              .getClienti$({
                idBusinessManager: this.idBm,
                idReferente: this.idPm,
                idSottoCommessa: this.idSottocommessa
              }),
          ])
        ),
        tap(([ pmList, bmList, clienti ]) => {
          this.pmList = pmList;
          this.bmList = bmList;
          this.clienti = clienti;
        })
      )
      .subscribe();
    
    this.clienteCtrl.valueChanges
      .pipe(
        switchMap(() =>
          combineLatest([
            this.miscData
              .getUtenti$({
                IsPm: true,
                IsBm: false,
                idSottoCommessa: this.idSottocommessa,
                idCliente: this.idCliente
              }),
            this.miscData
              .getUtenti$({
                IsPm: false,
                IsBm: true,
                idSottoCommessa: this.idSottocommessa,
                idCliente: this.idCliente
              }),
            this.miscData
              .getSottocommesse$({
                idReferente: this.idPm,
                idCliente: this.idCliente
              })
          ])
        ),
        tap(([ pmList, bmList, sottocommesse ]) => {
          this.pmList = pmList;
          this.bmList = bmList;
          this.sottocommesse = sottocommesse;
        })
      )
      .subscribe();
  }

  resetControls() {

    // DO NOT emit otherwise they will call the backend 6 times...
    this.pmCtrl.setValue(null, { emitEvent: false });
    this.bmCtrl.setValue(null, { emitEvent: false });
    this.sottocommessaCtrl.setValue(null, { emitEvent: false });
    this.clienteCtrl.setValue(null, { emitEvent: false });

    // ...instead clear the input manually
    this.clienteAutocomplete._autocompleteChoice = null;
    this.sottocommessaAutocomplete._autocompleteChoice = null;
    this.pmAutocomplete._autocompleteChoice = null;
    this.bmAutocomplete._autocompleteChoice = null;

    this.initializeAutocompleteValues();
    
    this.statoCtrl.setValue(0);
    this.statoAvanzamentoCtrl.setValue("");
    this.dataInizioCtrl.reset();
    this.dataFineCtrl.reset();
    this.meseCtrl.reset();
  }

  updateResults(avanzamento: GetSottoCommesseAvanzamentoResponse[]) {

    const idPmAvanzamento = avanzamento
      .reduce(
        (a, b) => {
          a[b.referente!.idUtente!] = a[b.referente!.idUtente!] || [];
          a[b.referente!.idUtente!].push(b);
          return a;
        },
        {} as { [key: number]: GetSottoCommesseAvanzamentoResponse[] }
      );

    const idPmList = Object.keys(idPmAvanzamento) as unknown as number[];

    if (!this.tabs) this.tabs = [];

    // Clean tabs that are not present in the current view
    for (let i = this.tabs.length - 1; i > -1; i--) {

      const tab = this.tabs[i];

      if (!idPmAvanzamento[tab.id])
        this.tabs.splice(i, 1);
    }

    // Create/update tabs
    for (const idPm of idPmList) {

      const { referente: ref } = idPmAvanzamento[idPm][0];

      this.addTab(
        idPm,
        ref!.cognome + ' ' + ref!.nome,
        idPmAvanzamento[idPm]
      );
    }

    // If current tab doesn't exist anymore, then go back to first
    if (!this.tabs.map(t => t.id).includes(this.activeTabId))
      this.activeTabId = this.tabs[0]?.id;
  }

  addTab(
    id: number,
    title: string,
    avanzamento: GetSottoCommesseAvanzamentoResponse[]
  ) {

    if (!this.tabs) return;

    // Update existing
    const tabIndex = this.tabs.findIndex(t => t.id === id);
    if (tabIndex > - 1) {
      this.tabs[tabIndex].avanzamento = avanzamento;
      return;
    }
    
    // Create new
    this.tabs.push({
      id,
      title,
      avanzamento
    });
  }

  hasUnsavedWork(t?: Tab) {

    // Check given tab
    if (t)
      return t.avanzamento.some(a =>
        a.dettaglioAvanzamento!.some(d =>
          (d as any)._dirty
        )
      );

    if (!this.tabs) return;

    // Check all tabs
    return this.tabs.some(t =>
      t.avanzamento.some(a =>
        a.dettaglioAvanzamento!.some(d =>
          (d as any)._dirty
        )
      )
    );
  }

  salvaDettaglio(dettaglio: GetSottoCommesseAvanzamentoResponse) {
    this.statoAvanzamentoWrap
      .postAvanzamento$(dettaglio)
      .pipe(
        catchError(err => {
          this.toastService.show(err.error, { classname: 'bg-danger text-light', delay: 10000 });
          return throwError(err);
        }),
        switchMap(() => this.statoAvanzamentoWrap.getAvanzamento$(this.lastSearchFilter)),
        tap(avanzamento => {
          this.toastService.show("Dettaglio avanzamento salvato con successo!", { classname: 'bg-success text-light'  });
          this.updateResults(avanzamento);
        })
      )
      .subscribe();
  }

  updateCumulativePercentages(
    avanzamento: GetSottoCommesseAvanzamentoResponse,
    dettaglio: DettaglioAvanzamento,
    percentElement: HTMLInputElement
  ) {

    const dettagli = avanzamento.dettaglioAvanzamento!;

    // Calculate the sum of other avanzamenti
    const sumOfTheRest = dettagli
      .filter(d => d !== dettaglio)
      .reduce((a, b: any) => a + b.avanzamentoTotale, 0);

    // Enforce min-max on input
    enforceMinMax(percentElement, 0, 100 - Math.ceil(sumOfTheRest));
    dettaglio.avanzamentoTotale = parseFloat(percentElement.value) || 0;

    // Recalculate cumulato
    for (let i = 0; i < dettagli.length; i++) {
      const prev = dettagli[i - 1] as any;
      const curr = dettagli[i] as any;
      curr.cumulato = curr.avanzamentoTotale + (prev ? prev.cumulato : 0);
    }

    (dettaglio as any)._dirty = true;
  }

  changeStatoValidazione(dettaglio: DettaglioAvanzamento, stato: EnumStatiChiusura) {
    dettaglio.statoValidazione!.id = stato;
    (dettaglio as any)._dirty = true;
  }

  selectChiusi(dettagliAvanzamento: DettaglioAvanzamento[]) {
    dettagliAvanzamento
      .filter(d => d.statoValidazione?.id === EnumStatiChiusura.Chiuso)
      .forEach(d => (d as any)._selected = true);
  }

  vistaSelezionati(dettagliAvanzamento: DettaglioAvanzamento[]) {

    // Create a massive request
    const requests = dettagliAvanzamento
      .filter(d => (d as any)._selected)
      .map(d =>
        this.statoAvanzamentoWrap
          .postAvanzamento$({
            ...d,
            statoValidazione: {
              ...d.statoValidazione,
              id: EnumStatiChiusura.Vistato
            }
          })
      );

    let hasError = false;
    combineLatest(requests)
      .pipe(
        catchError(() => {
          this.toastService.show("Qualcosa è andato storto durante la vistatura massiva.", { classname: 'bg-danger text-light', delay: 10000 });
          hasError = true;
          return of(1); // Move on anyway maybe something worked...
        }),
        switchMap(() => this.statoAvanzamentoWrap.getAvanzamento$(this.lastSearchFilter)),
        tap(avanzamento => {
          if (!hasError) {
            this.toastService.show("Dettagli avanzamento vistati con successo!", { classname: 'bg-success text-light'  });
          }
          this.updateResults(avanzamento);
        })
      )
      .subscribe();
  }

  trackByIdCommessa(index: number, avanzamento: GetSottoCommesseAvanzamentoResponse) {
    return avanzamento.commessa!.codice;
  }
}
