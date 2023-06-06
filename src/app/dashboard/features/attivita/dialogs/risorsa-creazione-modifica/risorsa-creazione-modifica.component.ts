import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Subject, catchError, combineLatest, lastValueFrom, map, of } from 'rxjs';
import { ToastService } from "src/app/services/toast.service";
import { DIALOG_MODE } from "../../models/dialog";
import { TaskService } from "../../services/task.service";
import { TaskDto } from "../../models/task";
import { GetDiarieResponse, Legame, Utente, UtentiAnagrafica } from "src/app/api/modulo-attivita/models";
import { dedupe, intersection } from "src/app/utils/array";
import { LegamiTaskUtenteService, TipiTrasfertaService } from "src/app/api/modulo-attivita/services";
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
    legame?: Legame;

    DIALOG_MODE = DIALOG_MODE;
    dialogMode!: DIALOG_MODE;
    isLoading = false;

    utentiCtrl = new FormControl<UtentiAnagrafica[] | null>(null, [Validators.required]);
    utenti: Utente[] = [];
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
        private legamiTaskUtenteService: LegamiTaskUtenteService,
        private taskService: TaskService,
        private tipiTrasfertaService: TipiTrasfertaService,
        private authService: AuthService,
        private miscData: MiscDataService
    ) { }

    async ngOnInit() {

        this.isLoading = true;

        this.dialogMode = this.idLegame
            ? DIALOG_MODE.Update
            : DIALOG_MODE.Create;

        this.utenti = this.miscData.utenti;

        if (this.dialogMode === DIALOG_MODE.Update) {
            [ this.task, this.legame ]  = await lastValueFrom(
                combineLatest([
                    this.taskService.getTaskById$(this.idTask),
                    this.legamiTaskUtenteService.getLegame({ idLegame: this.idLegame })
                ])
            );
        }
        else {
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
            
        if (!this.legame) return;

        const diaria = this.diarie.find(d => d.tipoTrasferta?.id === this.legame!.diaria?.id);
        this.diariaCtrl.setValue(diaria!);

        this.form.patchValue({
            utente: [ this.legame.utente! ],
            dataInizio: this.legame.inizio && this.legame.inizio.slice(0, 10),
            dataFine: this.legame.fine && this.legame.fine.slice(0, 10)
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

        if (this.form.invalid || (!this.utentiCtrl.value || this.utentiCtrl.value.length === 0)) return;

        const utentiSelezione = dedupe<UtentiAnagrafica>(this.utentiCtrl.value, "idUtente");

        const idUtentiLegami = await lastValueFrom(
            this.legamiTaskUtenteService
                .getLegami({ idTask: this.idTask })
                .pipe(
                    map(legami =>
                        legami.map(legame =>
                            legame.utente!.idUtente
                        )
                    )
                )
        );

        const idUtentiToExclude = intersection(
            utentiSelezione.map(u => u.idUtente),
            idUtentiLegami
        );

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

        // Send all requests in parallel
        combineLatest(
            utentiToSave.map(utente =>
                this.legamiTaskUtenteService
                    .postLegame({
                        body: {
                            idTask: this.idTask,
                            idUtente: utente.idUtente,
                            idDiaria: this.diariaCtrl.value?.id,
                            inizio: this.dataInizioCtrl.value,
                            fine: this.dataFineCtrl.value
                        }
                    })
                    .pipe(
                        catchError(() => {
                            const txt = `Non è stato possibile creare il Legame per ${utente.cognome} ${utente.nome}. Contattare il supporto tecnico.`;
                            this.toaster.show(txt, { classname: 'bg-danger text-white' });
                            return of(-1);
                        })
                    )
            )
        )
        .subscribe(() => {
            const txt = "Operazione terminata!";
            this.toaster.show(txt, { classname: 'bg-success text-white' });
            this.activeModal.close({ dialogMode: this.dialogMode });
        });
    }

    update() {

        if (!this.legame || this.form.invalid) return;

        const { id } = this.legame;

        this.legamiTaskUtenteService
            .postLegame({
                body: {
                    id,
                    idDiaria: this.diariaCtrl.value
                        ? this.diariaCtrl.value.id
                        : null,
                    inizio: this.dataInizioCtrl.value,
                    fine: this.dataFineCtrl.value
                }
            })
            .subscribe(
                () => {
                    const txt = "Legame modificato con successo!";
                    this.toaster.show(txt, { classname: 'bg-success text-white' });
                    this.activeModal.close({
                        dialogMode: this.dialogMode,
                        idLegame: id
                    });
                },
                () => {
                    const txt = "Non è stato possibile modificare il Legame. Contattare il supporto tecnico.";
                    this.toaster.show(txt, { classname: 'bg-danger text-white' });
                }
            );
    }
}