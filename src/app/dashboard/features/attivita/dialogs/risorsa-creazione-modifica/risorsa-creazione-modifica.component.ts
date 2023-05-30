import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Subject, catchError, combineLatest, lastValueFrom, map, of, switchMap } from 'rxjs';
import { ToastService } from "src/app/services/toast.service";
import { DIALOG_MODE } from "../../models/dialog";
import { TaskService } from "../../services/task.service";
import { TaskDto } from "../../models/task";
import { GetDiarieResponse, GetDiarieUtentiResponse, UtentiAnagrafica } from "src/app/api/modulo-attivita/models";
import { RisorsaTaskWrap, UpsertLegameParam } from "../../models/risorsa";
import { RisorsaService } from "../../services/risorsa.service";
import { dedupe, intersection } from "src/app/utils/array";
import { DatiOperativiService, TipiTrasfertaService } from "src/app/api/modulo-attivita/services";
import { AuthService } from "src/app/services/auth.service";
import { MiscDataService } from "../../../commons/services/miscellaneous-data.service";

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
    diariaUtente?: GetDiarieUtentiResponse;

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

    async ngOnInit() {

        this.isLoading = true;

        this.dialogMode = this.idLegame
            ? DIALOG_MODE.Update
            : DIALOG_MODE.Create;

        this.utenti = this.miscData.utenti;

        const taskAndLegame$ = combineLatest([
            this.taskService.getTaskById$(this.idTask),
            this.risorsaService.getLegameById$(this.idLegame)
        ]);

        if (this.dialogMode === DIALOG_MODE.Update) {

            // Get and assign task and legame
            [ this.task, this.legame ]  = await lastValueFrom(taskAndLegame$);
    
            // Get diarieUtenti
            const diarieUtenti = await lastValueFrom(
                this.datiOperativiService
                    .getDiarieUtenti({
                        idAzienda: this.authService.user.idAzienda!,
                        idAttivita: this.idTask,
                        idUtente: this.legame!.idUtente
                    })
            );
    
            this.diariaUtente = diarieUtenti[0]; // It's always a single element array BLAME THE BACKEEEEEND!!!
        }
        else {

            // Get task
            this.task = await lastValueFrom(
                this.taskService.getTaskById$(this.idTask)
            );
        }

        // Get diarie
        this.diarie = await lastValueFrom(
            this.tipiTrasfertaService
                .getDiarie({
                    IdAzienda: this.authService.user.idAzienda,
                    Valido: true
                })
        );

        this.initCtrlValues();
        this.isLoading = false;
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
            
        if (!this.legame) return;

        const diaria = this.diarie
            .find(d => d.tipoTrasferta?.id === this.diariaUtente?.trasferta?.idTipoTrasferta);
        this.diariaCtrl.setValue(diaria!);

        this.form.patchValue({
            utente: [this.legame.utente],
            dataInizio: this.legame.inizioAllocazione && this.legame.inizioAllocazione.slice(0, 10),
            dataFine: this.legame.fineAllocazione && this.legame.fineAllocazione.slice(0, 10)
        });
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

                let request = this.risorsaService
                    .createLegame$(legameTaskRisorsa)
                    .pipe(
                        catchError(() => {

                            const txt = `Non è stato possibile creare il Legame per ${utente.cognome} ${utente.nome}. Contattare il supporto tecnico.`;
                            this.toaster.show(txt, { classname: 'bg-danger text-white' });

                            return of(-1);
                        })
                    );

                // If diaria has a value, then add postDiarieUtenti to the current request
                if (this.diariaCtrl.value) {

                    const diariaUtente = {
                        idAzienda: this.authService.user.idAzienda!,
                        idAttivita: this.idTask,
                        idUtente: utente.idUtente!,
                        idDiaria: this.diariaCtrl.value?.tipoTrasferta?.id!,
                        body: { attivo: true }
                    };
        
                    request = request.pipe(
                        switchMap(() =>
                            this.datiOperativiService
                                .postDiarieUtenti(diariaUtente)
                                .pipe(
                                    catchError(() => {

                                        const txt = `Non è stato possibile assegnare la diaria per ${utente.cognome} ${utente.nome}. Contattare il supporto tecnico.`;
                                        this.toaster.show(txt, { classname: 'bg-danger text-white' });

                                        return of(-1);
                                    })
                                )
                        )
                    );
                }

                return request;
            });

        combineLatest(requests)
            .subscribe(() => {

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

        let request = this.risorsaService
            .updateLegame$(this.idLegame, legameTaskRisorsa);

        // If diariaUtente is set but diariaCtrl is not (the user explicitly removed diaria), then "delete" diariaUtente
        if (this.diariaUtente && !this.diariaCtrl.value) {

            const diariaUtente = {
                idAzienda: this.authService.user.idAzienda!,
                idAttivita: this.idTask,
                idUtente: this.legame.idUtente,
                idDiaria: this.diariaUtente.trasferta?.idTipoTrasferta!,
                body: { attivo: false }
            };

            request = request.pipe(
                switchMap(() =>
                    this.datiOperativiService
                        .postDiarieUtenti(diariaUtente)
                )
            );
        }

        // If diariaCtrl is set, then create/update diariaUtente
        if (this.diariaCtrl.value) {

            const diariaUtente = {
                idAzienda: this.authService.user.idAzienda!,
                idAttivita: this.idTask,
                idUtente: this.legame.idUtente,
                idDiaria: this.diariaCtrl.value?.tipoTrasferta?.id!,
                body: { attivo: true }
            };

            request = request.pipe(
                switchMap(() =>
                    this.datiOperativiService
                        .postDiarieUtenti(diariaUtente)
                )
            );
        }

        request.subscribe(
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