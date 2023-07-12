import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Subject, catchError, combineLatest, lastValueFrom, map, of } from 'rxjs';
import { ToastService } from "src/app/services/toast.service";
import { DIALOG_MODE } from "../../models/dialog";
import { TaskService } from "../../services/task.service";
import { TaskDto } from "../../models/task";
import { GetDiarieResponse, GetLegameResponse, Utente, UtentiAnagrafica } from "src/app/api/modulo-attivita/models";
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
    legame?: GetLegameResponse;

    DIALOG_MODE = DIALOG_MODE;
    dialogMode!: DIALOG_MODE;
    isLoading = false;

    utenti: Utente[] = [];
    diarie: GetDiarieResponse[] = [];
    utenteFormatter = (u: UtentiAnagrafica) => u.cognome + ' ' + u.nome;
    diariaFormatter = (d: GetDiarieResponse) => d.tipoTrasferta?.descrizione;

    get idDiaria() {
        if (this.form.value.diaria) return this.form.value.diaria.id;
        return null;
    }

    form = new FormGroup(
        {
            utenti: new FormControl<UtentiAnagrafica[] | null>(null, [ Validators.required ]),
            diaria: new FormControl<GetDiarieResponse | null>(null),
            inizio: new FormControl<string | null>(null, [ Validators.required ]),
            fine: new FormControl<string | null>(null, [ Validators.required ])
        },
        [
            formGroup => {
                const inizio = formGroup.value.inizio || "";
                const fine = formGroup.value.fine || "";
                if (inizio > fine) return { dates: "Invalid range." };
                return null;
            }
        ]
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

        this.utenti = await lastValueFrom(this.miscData.getUtenti$());

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

        this.form.patchValue({
            utenti: [ this.legame.utente! ],
            diaria: this.diarie.find(d => d.tipoTrasferta?.id === this.legame!.diaria?.id),
            inizio: this.legame.inizio && this.legame.inizio.slice(0, 10),
            fine: this.legame.fine && this.legame.fine.slice(0, 10)
        });
    }

    save() {
        if (this.dialogMode === DIALOG_MODE.Create) {
            this.create();
        }
        else {
            this.update();
        }
    }

    async create() {

        if (this.form.invalid || (!this.form.value.utenti || this.form.value.utenti.length === 0)) return;

        const utentiSelezione = dedupe<UtentiAnagrafica>(this.form.value.utenti, "idUtente");

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
                            idAzienda: this.authService.user.idAzienda, // This doesn't seem right, anyway...
                            idTask: this.idTask,
                            idUtente: utente.idUtente,
                            idDiaria: this.idDiaria,
                            ...this.form.value
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
                    idDiaria: this.idDiaria,
                    ...this.form.value
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