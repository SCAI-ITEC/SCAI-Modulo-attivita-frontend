import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Subject, catchError, combineLatest, lastValueFrom, map, of, takeUntil, tap } from "rxjs";
import { ToastService } from "src/app/services/toast.service";
import { euroMask, euroMask2numStr, numStr2euroMask } from "src/app/utils/mask";
import { DIALOG_MODE } from "../../models/dialog";
import { CommesseService, CommonsService } from "src/app/api/modulo-attivita/services";
import { EnumTipiFatturazione, GetCommessaResponse, GetCommesseResponse, GetTipoFatturazioneResponse, UtentiAnagrafica } from "src/app/api/modulo-attivita/models";
import { MiscDataService } from "../../../commons/services/miscellaneous-data.service";

@Component({
	selector: 'app-sottocommessa-creazione-modifica-dialog',
	templateUrl: './sottocommessa-creazione-modifica.component.html',
    styleUrls: ['./sottocommessa-creazione-modifica.component.css']
})
export class SottocommessaCreazioneModifica implements OnInit, OnDestroy {

    @Input("idCommessa") idCommessa!: number;
    @Input("idSottocommessa") idSottocommessa!: number;

    DIALOG_MODE = DIALOG_MODE;
    dialogMode!: DIALOG_MODE;
    isLoading = false;

    commessa?: GetCommessaResponse;
    sottocommessa?: GetCommessaResponse;

    utenteFormatter = (u: UtentiAnagrafica) => u.cognome + " " + u.nome;
    tipoFatturazioneFormatter = (tf: GetTipoFatturazioneResponse) => tf.descrizione;
    commessaFormatter = (sc: GetCommesseResponse) => sc?.codiceCommessa + ' ' + sc?.descrizione;

    // Lists
    utenti: UtentiAnagrafica[] = [];
    projectManagers: UtentiAnagrafica[] = [];
    iniziative: { text: string, value: string }[] = [];
    tipiFatturazione: GetTipoFatturazioneResponse[] = [];
    commesse: GetCommesseResponse[] = [];

    // Stuff related to importo
    euroMask = euroMask;
    get importo() {
        const masked = this.form.value.importo!;
        return euroMask2numStr(masked);
    }
    set importo(unmasked: string | null) {
        const masked = numStr2euroMask(unmasked || "0");
        this.form.controls.importo.setValue(masked);
    }

    form = new FormGroup({
        codiceCommessa: new FormControl<string | null>(null, [ Validators.required ]),
        descrizione: new FormControl<string | null>(null, [ Validators.required ]),
        projectManager: new FormControl<UtentiAnagrafica | null>(null, [ Validators.required ]),
        supportoController: new FormControl<UtentiAnagrafica | null>(null, [ Validators.required ]),
        iniziativa: new FormControl(),
        tipoFatturazione: new FormControl<GetTipoFatturazioneResponse | null>(null, [ Validators.required ]),
        commessaRendicontazione: new FormControl<GetCommesseResponse | null>(null),
        commessaFatturazione: new FormControl<GetCommesseResponse | null>(null),
        importo: new FormControl("0", [ Validators.required ]),
        dataInizio: new FormControl(),
        dataFine: new FormControl(),
        ribaltabileCliente: new FormControl(false)
    });

    destroy$ = new Subject<void>();

	constructor(
        public activeModal: NgbActiveModal,
        private toaster: ToastService,
        private miscData: MiscDataService,
        private commesseService: CommesseService,
        private commonsService: CommonsService
    ) { }

    ngOnInit() {

        this.isLoading = true;

        this.dialogMode = this.idSottocommessa
            ? DIALOG_MODE.Update
            : DIALOG_MODE.Create;

        if (this.dialogMode === DIALOG_MODE.Update) {
            combineLatest([
                this.commesseService.getCommessa({ id: this.idCommessa }),
                this.commesseService.getCommessa({ id: this.idSottocommessa })
            ])
            .subscribe(async ([ commessa, sottocommessa ]) => {
                this.commessa = commessa;
                this.sottocommessa = sottocommessa;
                await this.initArrays();
                this.initCtrlValuesUpdate();
                this.isLoading = false;
            });
        }
        else {
            this.commesseService
                .getCommessa({ id: this.idCommessa })
                .subscribe(async commessa => {
                    this.commessa = commessa;
                    await this.initArrays();
                    this.initCtrlValuesCreate();
                    this.isLoading = false;
                });
        }

        this.form.valueChanges
            .pipe(
                takeUntil(this.destroy$),
                tap(() => {

                    const inizioCtrl = this.form.controls.dataInizio;
                    const fineCtrl = this.form.controls.dataFine;

                    const isoInizio = inizioCtrl.value || "";
                    const isoFine = fineCtrl.value || "";

                    if (isoInizio > isoFine) {
                        inizioCtrl.setErrors({ date: "Too big" });
                        fineCtrl.setErrors({ date: "Too small" });
                    }
                    else {
                        inizioCtrl.setErrors(null);
                        fineCtrl.setErrors(null);
                    }

                    inizioCtrl.markAsTouched();
                    fineCtrl.markAsTouched();
                })
            )
            .subscribe();
    }

    ngOnDestroy() {
        this.destroy$.next();
    }

    async initArrays() {

        if (!this.commessa) return;

        const checkAziendaPropria = await lastValueFrom(
            this.commonsService
                .getTerzaParteCheckAziendaPropria({ idCliente: this.commessa.cliente?.id })
        );

        const iniziative = checkAziendaPropria
                ? [ "Struttura", "Stand By", "Non fatturato" ]
                : await lastValueFrom(
                    this.commonsService
                        .getIniziative({
                            idCliente: this.commessa.cliente?.id!,
                            idClienteFinale: this.commessa.clienteFinale?.id!,
                            idBusinessManager: this.commessa.businessManager?.id!
                        })
                        .pipe(
                            catchError(() => of([])) // Guard against failure because some old commesse don't have a business manager
                        )
                );

        this.iniziative = iniziative.map(iniz => ({ value: iniz, text: iniz }));
        this.form.controls.iniziativa.setValue(this.iniziative[0]?.value);

        this.tipiFatturazione = await lastValueFrom(
            this.commonsService.getTipoFatturazione()
                .pipe(
                    map(tipiFatturazione =>
                        tipiFatturazione.filter(tipoFatturazione =>
                            !tipoFatturazione.disabled
                        )
                    )
                )
        );

        [
            this.utenti,
            this.projectManagers,
            this.commesse
        ] = await lastValueFrom(
            combineLatest([
                this.miscData.getUtenti$(),
                this.miscData.getProjectManagers$(),
                this.miscData.getCommesse$()
            ])
        );
    }

    initCtrlValuesCreate() {
        if (!this.commessa) return;
        this.form.controls.codiceCommessa.setValue(this.commessa.codiceCommessa!);
    }

    initCtrlValuesUpdate() {

        if (!this.sottocommessa) return;

        this.form.patchValue({
            ...this.sottocommessa,
            importo: (this.sottocommessa.importo || 0) + ""
        });

        // Manually setting the rest of the fields
        if (this.sottocommessa.projectManager) {
            this.form.controls.projectManager.setValue({
                ...this.sottocommessa.projectManager,
                idUtente: this.sottocommessa.projectManager?.id
            })
        }

        if (this.sottocommessa.supportoController) {
            this.form.controls.supportoController.setValue({
                ...this.sottocommessa.supportoController,
                idUtente: this.sottocommessa.supportoController?.id
            })
        }

        const idTipoFatturazione = this.sottocommessa.tipoFatturazione?.id;
        const tipoFatturazione = this.tipiFatturazione.find(tf => tf.id === idTipoFatturazione)
        this.form.controls.tipoFatturazione.setValue(tipoFatturazione!);

        const idCommessaRendicontazione = this.sottocommessa.idCommessaCollegata;
        const commessaRendicontazione = this.commesse.find(c => c.id === idCommessaRendicontazione);
        this.form.controls.commessaRendicontazione.setValue(commessaRendicontazione!);

        const idCommessaFatturazione = this.sottocommessa.idCommessaFatturazione;
        const commessaFatturazione = this.commesse.find(c => c.id === idCommessaFatturazione);
        this.form.controls.commessaFatturazione.setValue(commessaFatturazione!);
    }

    save() {
        if (this.dialogMode === DIALOG_MODE.Create){
            this.create();
        }
        else {
            this.update();
        }
    }

    getRequest(id?: number | null) {
        return {
            id,
            ...this.form.value,
            idCommessaPadre: this.idCommessa,
            importo: parseFloat(this.importo || "0"),
            idProjectManager: this.form.value.projectManager?.idUtente,
            idSupportoController: this.form.value.supportoController?.idUtente,
            idTipoFatturazione: this.form.value.tipoFatturazione?.id as unknown as EnumTipiFatturazione, // WHY ON EARTH...?!
            idCommessaCollegata: this.form.value.commessaRendicontazione?.id,
            idCommessaFatturazione: this.form.value.commessaFatturazione?.id,
        };
    }

    create() {

        if (this.form.invalid) return;

        this.commesseService
            .postCommessa({ body: this.getRequest() })
            .subscribe(
                (sottocommessa) => {

                    const txt = "Sottocommessa creata con successo!";
                    this.toaster.show(txt, { classname: 'bg-success text-white' });

                    // Close the modal with the id from the result to open the tab automatically
                    this.activeModal
                        .close({
                            dialogMode: this.dialogMode,
                            item: sottocommessa
                        });
                },
                () => {
                    const txt = "Non è stato possibile creare la Sottocommessa. Contattare il supporto tecnico.";
                    this.toaster.show(txt, { classname: 'bg-danger text-white' });
                }
            );
    }

    update() {

        if (!this.sottocommessa || this.form.invalid) return;

        this.commesseService
            .postCommessa({ body: this.getRequest(this.sottocommessa.id) })
            .subscribe(
                (sottocommessa) => {
                    const txt = "Sottocommessa modificata con successo!";
                    this.toaster.show(txt, { classname: 'bg-success text-white' });
                    this.activeModal.close({
                        dialogMode: this.dialogMode,
                        item: sottocommessa
                    });
                },
                () => {
                    const txt = "Non è stato possibile modificare la Sottocommessa. Contattare il supporto tecnico.";
                    this.toaster.show(txt, { classname: 'bg-danger text-white' });
                }
            );
    }
}