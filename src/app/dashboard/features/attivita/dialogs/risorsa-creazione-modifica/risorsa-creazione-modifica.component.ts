import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Subject, catchError, combineLatest, lastValueFrom, map, of, switchMap, tap } from 'rxjs';
import { ToastService } from "src/app/services/toast.service";
import { DIALOG_MODE } from "../../models/dialog";
import { TaskService } from "../../services/task.service";
import { TaskDto } from "../../models/task";
import { GetDiarieResponse, UtentiAnagrafica } from "src/app/api/modulo-attivita/models";
import { MiscDataService } from "../../services/miscData.service";
import { RisorsaTaskWrap, UpsertLegameParam } from "../../models/risorsa";
import { RisorsaService } from "../../services/risorsa.service";
import { dedupe, intersection } from "src/app/utils/array";
import { DatiOperativiService, TipiTrasfertaService } from "src/app/api/modulo-attivita/services";
import { AuthService } from "src/app/services/auth.service";

@Component({
	selector: 'app-risorsa-creazione-modifica-dialog',
	templateUrl: './risorsa-creazione-modifica.component.html',
    styleUrls: ['./risorsa-creazione-modifica.component.css']
})
export class RisorsaCreazioneModifica implements OnInit, OnDestroy {

    @Input("idCommessa") idCommessa!: number;
    @Input("idSottocommessa") idSottocommessa!: number;
    @Input("idTask") idTask!: number;
    @Input("idLegame") idLegame!: number;
    task?: TaskDto;
    legame?: RisorsaTaskWrap;

    DIALOG_MODE = DIALOG_MODE;
    dialogMode!: DIALOG_MODE;
    isLoading = false;

    utentiCtrl = new FormControl<UtentiAnagrafica[] | null>(null, [Validators.required]);
    utenti: UtentiAnagrafica[] = [];
    utenteFormatter = (u: UtentiAnagrafica) => u.cognome + ' ' + u.nome;

    dataInizioCtrl = new FormControl<string | null>(null, [Validators.required]);
    dataFineCtrl = new FormControl<string | null>(null, [Validators.required]);

    diariaCtrl = new FormControl<GetDiarieResponse | null>(null);
    diarie: GetDiarieResponse[] = [];
    diariaFormatter = (d: GetDiarieResponse) => d.tipoTrasferta?.descrizione;

    datesValidator = () => {

        const isoInizio = this.dataInizioCtrl.value || "";
        const isoFine = this.dataFineCtrl.value || "";

        if (isoInizio > isoFine)
            return { dates: "Invalid range." };
        
        return null;
    };

    form = new FormGroup(
        {
            utente: this.utentiCtrl,
            dataInizio: this.dataInizioCtrl,
            dataFine: this.dataFineCtrl
        },
        [ this.datesValidator ]
    );

    destroy$ = new Subject<void>();

	constructor(
        public activeModal: NgbActiveModal,
        private toaster: ToastService,
        private risorsaService: RisorsaService,
        private taskService: TaskService,
        private tipiTrasfertaService: TipiTrasfertaService,
        private datiOperativiService: DatiOperativiService,
        private authService: AuthService,
        private miscData: MiscDataService
    ) { }

    ngOnInit() {

        this.isLoading = true;

        this.dialogMode = this.idLegame
            ? DIALOG_MODE.Update
            : DIALOG_MODE.Create;

        this.utenti = this.miscData.utenti;

        if (this.dialogMode === DIALOG_MODE.Update) {
            combineLatest([
                this.taskService.getTaskById$(this.idTask),
                this.risorsaService.getLegameById$(this.idLegame)
            ])
            .pipe(
                switchMap(([ task, legame ]) =>
                    combineLatest(
                        of(task),
                        of(legame),
                        this.datiOperativiService
                            .getDiarieUtenti({
                                idAzienda: this.authService.user.idAzienda!,
                                idAttivita: this.idTask,
                                idUtente: legame.idUtente
                            })
                    )
                )
            )
            .subscribe(([ task, legame, diarieUtenti ]) => {
                console.log(diarieUtenti);
                this.legame = legame;
                this.task = task;
                this.initCtrlValues();
                this.isLoading = false;
            });
        }
        else {
            this.taskService
                .getTaskById$(this.idTask)
                .subscribe(task => {
                    this.task = task;
                    this.initCtrlValues();
                    this.isLoading = false;
                });
        }
    }

    ngOnDestroy() {
        this.destroy$.next();
    }

    initCtrlValues() {

        // esempio legame {
        //     "allocazione": null,
        //     "fineAllocazione": null,
        //     "id": 43927,
        //     "idAzienda": 9
        //     "idTask": 4541,
        //     "idUtente": 217,
        //     "inizioAllocazione": null,
        // }

        this.tipiTrasfertaService
            .getDiarie()
            .pipe(
                map(diarie => diarie.filter(d => d.valido && d.azienda?.id === this.authService.user.idAzienda)),
                tap(diarie => this.diarie = diarie)
            )
            .subscribe();

        if (this.dialogMode === DIALOG_MODE.Update) {
            
            if (!this.legame) return;

            this.form.patchValue({
                utente: [this.legame.utente],
                dataInizio: this.legame.inizioAllocazione && this.legame.inizioAllocazione.slice(0, 10),
                dataFine: this.legame.fineAllocazione && this.legame.fineAllocazione.slice(0, 10)
            });
        }
    }

    dataInizioCtrlMin() {

        const inception = "1970-01-01";

        if (!this.task)
            return inception;

        return this.task.dataInizio;
    }

    dataInizioCtrlMax() {

        const endOfWorld = "2239-01-01"; // According to the Talmud

        if (!this.task)
            return endOfWorld;

        const dataFineTask = this.task.dataFine || endOfWorld;

        if (!this.dataFineCtrl.value)
            return dataFineTask;

        if (this.dataFineCtrl.value.localeCompare(dataFineTask) <= 0)
            return this.dataFineCtrl.value;
        
        return dataFineTask;
    }

    dataFineCtrlMin() {

        const inception = "1970-01-01";

        if (!this.task)
            return inception;

        const dataInizioTask = this.task.dataInizio || inception;

        if (!this.dataInizioCtrl.value)
            return dataInizioTask;

        if (this.dataInizioCtrl.value.localeCompare(dataInizioTask) >= 0)
            return this.dataInizioCtrl.value;
        
        return dataInizioTask;
    }

    dataFineCtrlMax() {

        const endOfWorld = "2239-01-01"; // According to the Talmud

        if (!this.task)
            return endOfWorld;

        return this.task.dataFine;
    }

    save() {
        if (this.dialogMode === DIALOG_MODE.Create)
            this.create();
        else
            this.update();
    }

    async create() {

        // esempio di payload {
        //     "allocazione": 100,
        //     "fineAllocazione": "2015-06-29T22:00:00.000Z",
        //     "id": null,
        //     "idAzienda": 9
        //     "idTask": 4541,
        //     "idUtente": 5352,
        //     "inizioAllocazione": "2013-12-31T23:00:00.000Z",
        // }

        if (this.form.invalid || (!this.utentiCtrl.value || this.utentiCtrl.value.length === 0)) return;

        const utentiSelezione = dedupe<UtentiAnagrafica>(this.utentiCtrl.value, "idUtente");

        const idUtentiLegami = await lastValueFrom(
            this.risorsaService
                .getLegamiByIdTask$(this.idTask)
                .pipe(
                    map(ls => ls.map(l => l.idUtente))
                )
        );

        const idUtentiToExclude = intersection(utentiSelezione.map(u => u.idUtente), idUtentiLegami);

        // Filter out any existing user, throw an error toast
        const utentiToSave = utentiSelezione
            .filter(utente => {

                if (idUtentiToExclude.includes(utente.idUtente)) {
                    const txt = utente.cognome + " " + utente.nome + " è già presente pertanto non è stato salvato.";
                    this.toaster.show(txt, { classname: 'bg-danger text-white' });
                    return false;
                }

                return true;
            });

        const requests = utentiToSave
            .map(utente => {

                const legameTaskRisorsa: UpsertLegameParam = {
                    idTask: this.idTask,
                    idUtente: utente.idUtente!,
                    inizioAllocazione: this.dataInizioCtrl.value!,
                    fineAllocazione: this.dataFineCtrl.value!
                };

                const request = [
                    this.risorsaService
                        .createLegame$(legameTaskRisorsa)
                        .pipe(
                            catchError(() => {

                                const txt = `Non è stato possibile creare il Legame per ${utente.cognome} ${utente.nome}. Contattare il supporto tecnico.`;
                                this.toaster.show(txt, { classname: 'bg-danger text-white' });

                                return of(-1);
                            })
                        )
                ];

                // If diaria has a value, then add it to the current request
                if (this.diariaCtrl.value) {

                    const diariaUtente = {
                        idAzienda: this.authService.user.idAzienda!,
                        idAttivita: this.idTask,
                        idUtente: utente.idUtente!,
                        idDiaria: this.diariaCtrl.value?.tipoTrasferta?.id!,
                        body: { attivo: true }
                    };
        
                    request.push(
                        this.datiOperativiService
                            .postDiarieUtenti(diariaUtente)
                            .pipe(
                                catchError(() => {

                                    const txt = `Non è stato possibile assegnare la diaria per ${utente.cognome} ${utente.nome}. Contattare il supporto tecnico.`;
                                    this.toaster.show(txt, { classname: 'bg-danger text-white' });

                                    return of(-1);
                                })
                            )
                    );
                }

                return combineLatest(request);
            });

        combineLatest(requests)
            .subscribe(responses => {

                const txt = "Operazione terminata!";
                this.toaster.show(txt, { classname: 'bg-success text-white' });

                this.activeModal.close({ dialogMode: this.dialogMode });
            });
    }

    update() {

        // {
        //     "allocazione": 1,
        //     "fineAllocazione": "2015-06-29T22:00:00.000Z",
        //     "id": 43923,
        //     "idAzienda": 9
        //     "idTask": 4541,
        //     "idUtente": 208,
        //     "inizioAllocazione": "2015-05-31T22:00:00.000Z",
        // }

        if (!this.legame || this.form.invalid) return;

        const legameTaskRisorsa: UpsertLegameParam = {
            idTask: this.idTask,
            idUtente: this.legame.idUtente,
            inizioAllocazione: this.dataInizioCtrl.value!,
            fineAllocazione: this.dataFineCtrl.value!
        };

        this.risorsaService
            .updateLegame$(this.idLegame, legameTaskRisorsa)
            .subscribe(
                () => {
                    const txt = "Legame modificato con successo!";
                    this.toaster.show(txt, { classname: 'bg-success text-white' });
                    this.activeModal.close({
                        dialogMode: this.dialogMode,
                        item: legameTaskRisorsa
                    });
                },
                () => {
                    const txt = "Non è stato possibile modificare il Legame. Contattare il supporto tecnico.";
                    this.toaster.show(txt, { classname: 'bg-danger text-white' });
                }
            );
    }
}