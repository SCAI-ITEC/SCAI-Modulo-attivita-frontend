import { Component, Input } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { combineLatest, lastValueFrom } from "rxjs";
import { ToastService } from "src/app/services/toast.service";
import { jsonCopy } from "src/app/utils/json";
import { euroMask, euroMask2numStr, numStr2euroMask } from "src/app/utils/mask";
import { Commessa, CommessaDto, CreateSottocommessaParam, SimpleDto } from "../../models/commessa";
import { DIALOG_MODE } from "../../models/dialog";
import { TipoFatturazione } from "../../models/fatturazione";
import { CommessaService } from "../../services/commessa.service";
import { SottocommessaService } from "../../services/sottocommessa.service";

@Component({
	selector: 'app-sottocommessa-creazione-modifica-dialog',
	templateUrl: './sottocommessa-creazione-modifica.component.html',
    styleUrls: ['./sottocommessa-creazione-modifica.component.css']
})
export class SottocommessaCreazioneModifica {

    @Input("idCommessa") idCommessa!: number;
    @Input("idSottocommessa") idSottocommessa!: number;

    DIALOG_MODE = DIALOG_MODE;
    dialogMode!: DIALOG_MODE;
    isLoading = false;

    commessa?: CommessaDto;
    sottocommessa?: CommessaDto;

    form!: FormGroup;

    codiceSottocommessaCtrl = new FormControl<string | null>(null, [Validators.required]);
    descrizioneCtrl = new FormControl<string | null>(null, [Validators.required]);

    iniziativaCtrl = new FormControl();
    iniziative: { text: string, value: string }[] = [];

    tipoFatturazioneCtrl = new FormControl<TipoFatturazione | null>(null, [Validators.required]);
    get tipoFatturazione(): SimpleDto {
        const { id, descrizione: text } = this.tipoFatturazioneCtrl.value as TipoFatturazione;
        return { id, text };
    }
    tipoFatturazioneFormatter = (tf: TipoFatturazione) => tf.descrizione;
    tipoFatturazioneFilter = (term: string, tf: TipoFatturazione) =>
        (tf.descrizione as string).toLowerCase().includes(term.toLowerCase());
    tipiFatturazione: TipoFatturazione[] = [];

    commessaRendicontazioneCtrl = new FormControl<Commessa | null>(null);
    get idCommessaRendicontazione() {
        return this.commessaRendicontazioneCtrl.value?.id;
    }
    commessaFatturazioneCtrl = new FormControl<Commessa | null>(null);
    get idCommessaFatturazione() {
        return this.commessaFatturazioneCtrl.value?.id;
    }
    commesse: Commessa[] = [];
    commesseFormatter = (sc: Commessa) => sc?.codice + ' ' + sc?.descrizione;
    commesseFilter = (term: string, sc: Commessa) =>
        (sc?.codice + ' ' + sc?.descrizione).toLowerCase().includes(term.toLowerCase());

    dataInizioCtrl = new FormControl();
    dataFineCtrl = new FormControl();

    euroMask = euroMask;
    get importo() {
        const masked = this.importoCtrl.value as string;
        return euroMask2numStr(masked);
    }
    set importo(unmasked: string) {
        const masked = numStr2euroMask(unmasked);
        this.importoCtrl.setValue(masked);
    }
	importoCtrl = new FormControl("0", [Validators.required]);

    trasfertaRibaltabileClienteCtrl = new FormControl();
    abilitazioneReperibilitaCtrl = new FormControl();
    abilitazioneStraordinarioCtrl = new FormControl();

	constructor(
        public activeModal: NgbActiveModal,
        private toaster: ToastService,
        private commessaService: CommessaService,
        private sottocommessaService: SottocommessaService
    ) { }

    ngOnInit() {

        this.isLoading = true;

        this.dialogMode = this.idSottocommessa
            ? DIALOG_MODE.Update
            : DIALOG_MODE.Create;

        if (this.dialogMode === DIALOG_MODE.Update) {

            combineLatest([
                this.commessaService.getCommessaById(this.idCommessa),
                this.sottocommessaService.getSottocommessaById$(this.idSottocommessa)
            ])
            .subscribe(async ([ commessa, sottocommessa ]) => {
                this.commessa = commessa;
                this.sottocommessa = sottocommessa;
                await this.initArrays();
                this.initCtrlValues();
                this.isLoading = false;
            });
        }
        else {

            this.commessaService.getCommessaById(this.idCommessa)
                .subscribe(async commessa => {
                    this.commessa = commessa;
                    await this.initArrays();
                    this.initCreationCtrlValues();
                    this.isLoading = false;
                });
        }

        this.form = new FormGroup({
            codiceSottocommessa: this.codiceSottocommessaCtrl,
            descrizione: this.descrizioneCtrl,
            iniziativa: this.iniziativaCtrl,
            tipoFatturazione: this.tipoFatturazioneCtrl,
            importo: this.importoCtrl,
            trafertaRibaltabileCliente: this.trasfertaRibaltabileClienteCtrl,
            abilitazioneReperibilita: this.abilitazioneReperibilitaCtrl,
            abilitazioneStraordinario: this.abilitazioneStraordinarioCtrl,
        });
    }

    async initArrays() {

        if (!this.commessa) return;

        let checkAziendaPropria = true;
        try {
            checkAziendaPropria = await lastValueFrom(
                this.commessaService
                    .checkAziendaPropria$(this.commessa.idCliente)
                    // This call fails 50% of the times
            );
        }
        catch(e) {
            console.error("checkAziendaPropria failed...");
        }

        let iniziative: string[] = [];
        if (checkAziendaPropria) {
            iniziative = [ "Struttura", "Stand By", "Non fatturato" ];
        }
        else {
            try {
                iniziative = await lastValueFrom(
                    this.sottocommessaService
                        .getIniziative$(
                            this.commessa.idCliente,
                            this.commessa.idClienteFinale,
                            this.commessa.idBusinessManager
                        ) // This call fails 50% of the times
                );
            }
            catch(e) {
                console.error("getIniziativa failed...");
            }
        }

        this.iniziative = iniziative.map(inz => ({ text: inz, value: inz }));

        if (this.iniziative[0].value)
            this.iniziativaCtrl.setValue(this.iniziative[0].value);

        try {
            this.tipiFatturazione = await lastValueFrom(
                this.sottocommessaService.getTipiFatturazione$()
                // This call fails 50% of the times
            );
        }
        catch(e) {
            console.error("getTipiFatturazione failed...");
        }

        this.commesse = await lastValueFrom(
            this.commessaService.getCommesseAutocomplete$()
        );
    }

    initCreationCtrlValues() {

        if (!this.commessa) return;

        this.codiceSottocommessaCtrl.setValue(this.commessa.codiceCommessa);
    }

    initCtrlValues() {

        if (this.dialogMode === DIALOG_MODE.Update) {

            if (!this.sottocommessa) return;

            this.codiceSottocommessaCtrl.setValue(this.sottocommessa.codiceCommessa);
            this.descrizioneCtrl.setValue(this.sottocommessa.descrizione);

            this.iniziativaCtrl.setValue(this.sottocommessa.iniziativa);

            const idTipoFatturazione = this.sottocommessa.tipoFatturazione.id;
            const tipoFatturazione = this.tipiFatturazione.find(tf =>
                tf.id === idTipoFatturazione
            )
            this.tipoFatturazioneCtrl.setValue(tipoFatturazione as TipoFatturazione);

            const idCommessaRendicontazione = this.sottocommessa.idCommessaCollegata;
            const commessaRendicontazione = this.commesse.find(c =>
                c.id === idCommessaRendicontazione   
            );
            this.commessaRendicontazioneCtrl.setValue(commessaRendicontazione as Commessa);

            const idCommessaFatturazione = this.sottocommessa.idCommessaFatturazione;
            const commessaFatturazione = this.commesse.find(c =>
                c.id === idCommessaFatturazione   
            );
            this.commessaFatturazioneCtrl.setValue(commessaFatturazione as Commessa);

            this.dataInizioCtrl.setValue(this.sottocommessa.dataInizio);
            this.dataFineCtrl.setValue(this.sottocommessa.dataFine);

            this.importo = this.sottocommessa.importo;

            this.trasfertaRibaltabileClienteCtrl.setValue(this.sottocommessa.ribaltabileCliente);
        }
    }

    save() {
        if (this.dialogMode === DIALOG_MODE.Create)
            this.create();
        else
            this.update();
    }

    create() {

        if (this.form.invalid) return;

        const createObj: CreateSottocommessaParam = {
            idCommessaPadre: this.idCommessa,
            codiceCommessa: this.codiceSottocommessaCtrl.value as string,
            descrizione: this.descrizioneCtrl.value as string,
            iniziativa: this.iniziativaCtrl.value as string,
            tipoFatturazione: this.tipoFatturazione,
            dataInizio: this.dataInizioCtrl.value,
            dataFine: this.dataInizioCtrl.value,
            importo: +this.importo, // Dunno why on update is a string and in create is a number...
            ribaltabileCliente: !!this.trasfertaRibaltabileClienteCtrl.value
        };
        
        this.sottocommessaService
            .createSottocommessa$(createObj)
            .subscribe(
                (idSottocommessa) => {

                    const txt = "Sottocommessa creata con successo!";
                    this.toaster.show(txt, { classname: 'bg-success text-white' });

                    // Close the modal with the id from the result to open the tab automatically
                    this.activeModal
                        .close({
                            dialogMode: this.dialogMode,
                            idSottocommessa,
                            codiceSottocommessa: this.codiceSottocommessaCtrl.value
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

        const copyOfSottocommessa: CommessaDto = jsonCopy(this.sottocommessa);
        
        copyOfSottocommessa.codiceCommessa = this.codiceSottocommessaCtrl.value as string;
        copyOfSottocommessa.descrizione = this.descrizioneCtrl.value as string;
        copyOfSottocommessa.iniziativa = this.iniziativaCtrl.value as string;
        copyOfSottocommessa.tipoFatturazione = this.tipoFatturazione;
        copyOfSottocommessa.idCommessaCollegata = this.idCommessaRendicontazione;
        copyOfSottocommessa.idCommessaFatturazione = this.idCommessaFatturazione;
        copyOfSottocommessa.dataInizio = this.dataInizioCtrl.value;
        copyOfSottocommessa.dataFine = this.dataFineCtrl.value;
        copyOfSottocommessa.importo = this.importo;
        copyOfSottocommessa.ribaltabileCliente = !!this.trasfertaRibaltabileClienteCtrl.value;

        this.sottocommessaService
            .updateSottocommessa$(
                this.idSottocommessa,
                copyOfSottocommessa
            )
            .subscribe(
                () => {
                    const txt = "Sottocommessa modificata con successo!";
                    this.toaster.show(txt, { classname: 'bg-success text-white' });
                    this.activeModal.close({
                        dialogMode: this.dialogMode,
                        item: copyOfSottocommessa
                    });
                },
                () => {
                    const txt = "Non è stato possibile modificare la Sottocommessa. Contattare il supporto tecnico.";
                    this.toaster.show(txt, { classname: 'bg-danger text-white' });
                }
            );
    }
}