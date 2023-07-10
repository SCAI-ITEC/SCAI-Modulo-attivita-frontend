import { Component, Input } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { lastValueFrom, combineLatest, startWith } from "rxjs";
import { Dettaglio, EnumTipoAttivita, GetCommessaResponse, UtentiAnagrafica } from "src/app/api/modulo-attivita/models";
import { ToastService } from "src/app/services/toast.service";
import { DIALOG_MODE } from "../../models/dialog";
import { ROLES } from "src/app/models/user";
import { MiscDataService } from "../../../commons/services/miscellaneous-data.service";
import { CommesseService } from "src/app/api/modulo-attivita/services";
import { AuthService } from "src/app/services/auth.service";

@Component({
	selector: 'app-commessa-creazione-modifica-dialog',
	templateUrl: './commessa-creazione-modifica.component.html',
    styleUrls: ['./commessa-creazione-modifica.component.css']
})
export class CommessaCreazioneModifica {

    @Input("idCommessa") idCommessa!: number;
    
    ROLES = ROLES;
    DIALOG_MODE = DIALOG_MODE;
    dialogMode!: DIALOG_MODE;
    isLoading = false;

    commessa?: GetCommessaResponse;

    clienteFormatter = (c: Dettaglio) => c.descrizione;
    bmFormatter = (bm: UtentiAnagrafica) => bm.cognome + ' ' + bm.nome;

    clienti: Dettaglio[] = [];
    clientiFinali: Dettaglio[] = [];
    businessManagers: UtentiAnagrafica[] = [];
    tipiAttivita = [
        { text: 'Opportunità', _descr: "optn", value: 1 },
        { text: 'Commessa interna', _descr: "cmint", value: 2 }
    ];

    form = new FormGroup({
        cliente: new FormControl<Dettaglio | null>(null, [ Validators.required ]),
        clienteFinale: new FormControl<Dettaglio | null>(null, [ Validators.required ]),
        businessManager: new FormControl<UtentiAnagrafica | null>(null, [ Validators.required ]),
        tipoAttivita: new FormControl<number>(1),
        codiceCommessa: new FormControl<string | null>(null, [ Validators.required ]),
        descrizione: new FormControl<string | null>(null, [ Validators.required ]),
        tag: new FormControl<string | null>(null, [ Validators.maxLength(5) ]),
        dataInserimento: new FormControl(new Date().toISOString().slice(0, 10)),
        dataDecorrenza: new FormControl()
    });

	constructor(
        public activeModal: NgbActiveModal,
        private authService: AuthService,
        private toaster: ToastService,
        private commesseService: CommesseService,
        private miscData: MiscDataService
    ) { }

    ngOnInit() {

        this.dialogMode = this.idCommessa
            ? DIALOG_MODE.Update
            : DIALOG_MODE.Create;

        if (this.dialogMode === DIALOG_MODE.Update) {
            this.isLoading = true;
            this.commesseService
                .getCommessa({ id: this.idCommessa })
                .subscribe(commessa => {
                    this.commessa = commessa;
                    this.initCtrlValues();
                    this.isLoading = false;
                });
        }
        else {
            this.initCtrlValues();
        }

        // Dynamic validators (adds or removes required from controls when a third control changes)
        this.form.controls.tipoAttivita.valueChanges
            .pipe(startWith(null))
            .subscribe(idTipoAttivita => {

                const ddCtrl = this.form.controls.dataDecorrenza;
                const ccCtrl = this.form.controls.codiceCommessa;

                ddCtrl.setValidators(idTipoAttivita == 1 ? [ Validators.required ] : null);
                ccCtrl.setValidators(idTipoAttivita == 2 ? [ Validators.required ] : null);

                ddCtrl.updateValueAndValidity();
                ccCtrl.updateValueAndValidity();

                this.form.updateValueAndValidity();
            });
    }

    async initCtrlValues() {

        if (!this.commessa) return;

        this.form.patchValue({
            ...this.commessa,
            dataInserimento: this.commessa.dataInserimento?.slice(0, 10), // I dunno why the BE includes the time here...
            tipoAttivita: this.commessa.tipoAttivita?.id
        });

        // Manually setting the rest of the fields
        if (this.commessa.businessManager) {
            this.form.controls["businessManager"].setValue({
                ...this.commessa.businessManager,
                idUtente: this.commessa.businessManager?.id
            })
        }

        [
            this.clienti,
            this.businessManagers
        ] = await lastValueFrom(
            combineLatest([
                this.miscData.getClienti$(),
                this.miscData.getBusinessManagers$()
            ])
        );

        this.clientiFinali = this.clienti;
    }

    save() {
        if (this.dialogMode === DIALOG_MODE.Create)
            this.create();
        else
            this.update();
    }

    requestObject(id?: number) {

        const { idAzienda } = this.authService.user;

        const request = {
            id,
            idAzienda,
            ...this.form.value,
            idCliente: this.form.value.cliente?.id,
            idClienteFinale: this.form.value.clienteFinale?.id,
            idBusinessManager: this.form.value.businessManager?.idUtente,
            idTipoAttivita: this.form.value.tipoAttivita as unknown as EnumTipoAttivita
        };

        if (this.form.value.tipoAttivita === 1) {
            delete request.codiceCommessa; // Otherwise the server goes into error (Blame the BE!)
        }

        return request;
    }

    create() {

        if (this.form.invalid) return;

        this.commesseService
            .postCommessa({
                body: this.requestObject()
            })
            .subscribe(
                result => {

                    const txt = "Commessa creata con successo!";
                    this.toaster.show(txt, { classname: 'bg-success text-white' });

                    // Close the modal with the id from the result to open the tab automatically
                    this.activeModal
                        .close({
                            dialogMode: this.dialogMode,
                            idCommessa: result.id,
                            codiceCommessa: result.codiceCommessa
                        });
                },
                () => {
                    const txt = "Non è stato possibile creare la commessa. Contattare il supporto tecnico.";
                    this.toaster.show(txt, { classname: 'bg-danger text-white' });
                }
            );
    }

    update() {

        if (!this.commessa || this.form.invalid) return;

        this.commesseService
            .postCommessa({ body: this.requestObject(this.commessa?.id) })
            .subscribe(
                () => {
                    const txt = "Commessa modificata con successo!";
                    this.toaster.show(txt, { classname: 'bg-success text-white' });
                    this.activeModal.close({ dialogMode: this.dialogMode, item: this.commessa });
                },
                () => {
                    const txt = "Non è stato possibile modificare la commessa. Contattare il supporto tecnico.";
                    this.toaster.show(txt, { classname: 'bg-danger text-white' });
                }
            );
    }
}