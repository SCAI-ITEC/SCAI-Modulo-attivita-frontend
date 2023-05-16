import { Component, Input } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { ToastService } from "src/app/services/toast.service";
import { AuthService } from "src/app/services/auth.service";
import { SegreteriaService } from "src/app/api/modulo-attivita/services";
import { Subject, takeUntil, tap } from "rxjs";
import { euroMask, euroMask2numStr } from "src/app/utils/mask";

@Component({
	selector: 'app-straordinari-creazione-dialog',
	templateUrl: './straordinari-creazione.component.html',
    styleUrls: ['./straordinari-creazione.component.css']
})
export class StraordinariCreazioneComponent {

    @Input("idSottocommessa") idSottocommessa!: number;

    dataInizioCtrl = new FormControl<string | null>(null, [Validators.required]);
    dataFineCtrl = new FormControl<string | null>(null, [Validators.required]);

    descrizioneCtrl = new FormControl<string | null>(null, [Validators.required]);
    
    straordinarioOrdinarioCtrl = new FormControl<string | null>(null);
    straordinarioSabatoCtrl = new FormControl<string | null>(null);
    straordinarioFestivoCtrl = new FormControl<string | null>(null);
    straordinarioNotturnoCtrl = new FormControl<string | null>(null);

    autorizzazioneClienteCtrl = new FormControl<boolean>(false);

    euroMask = euroMask;
    // Get euro value from field with
    //     const masked = this.importoCtrl.value!;
    //     return euroMask2numStr(masked);
    //
    // Set euro value to field with 
    //     const masked = numStr2euroMask(unmasked);
    //     this.importoCtrl.setValue(masked);
    //

    datesValidator = () => {

        const isoInizio = this.dataInizioCtrl.value || "";
        const isoFine = this.dataFineCtrl.value || "";

        if (isoInizio > isoFine)
            return { dates: "Invalid range." };
        
        return null;
    };

    form = new FormGroup(
        {
            dataInizio: this.dataInizioCtrl,
            dataFine: this.dataFineCtrl,
            descrizione: this.descrizioneCtrl,
            straordinarioOrdinario: this.straordinarioOrdinarioCtrl,
            straordinarioSabato: this.straordinarioSabatoCtrl,
            straordinarioFestivo: this.straordinarioFestivoCtrl,
            straordinarioNotturno: this.straordinarioNotturnoCtrl,
            autorizzazioneCliente: this.autorizzazioneClienteCtrl
        },
        [ this.datesValidator ]
    );

    destroy$ = new Subject<void>();

	constructor(
        public activeModal: NgbActiveModal,
        private authService: AuthService,
        private segreteriaService: SegreteriaService,
        private toaster: ToastService
    ) { }

    ngOnInit() { }

    create() {

        if (this.form.invalid) return;

        const strOrdVal = this.straordinarioOrdinarioCtrl.value
            ? +euroMask2numStr(this.straordinarioOrdinarioCtrl.value)
            : null;

        const strSabVal = this.straordinarioSabatoCtrl.value
            ? +euroMask2numStr(this.straordinarioSabatoCtrl.value)
            : null;

        const strFestVal = this.straordinarioFestivoCtrl.value
            ? +euroMask2numStr(this.straordinarioFestivoCtrl.value)
            : null;

        const strNottVal = this.straordinarioNotturnoCtrl.value
            ? +euroMask2numStr(this.straordinarioNotturnoCtrl.value)
            : null;

        this.segreteriaService
            .postStraordinariTerzeParti({
                idAzienda: this.authService.user.idAzienda!,
                idLegameStraordinari: 0,
                body: {
                    inizio: this.dataInizioCtrl.value!, // Why it does complain if it's undefined while for fine does not? Blame the BE!
                    fine: this.dataFineCtrl.value,
                    idSottoCommessa: this.idSottocommessa,
                    descrizione: this.descrizioneCtrl.value,
                    straordinarioOrdinarioCliente: strOrdVal,
                    straordinarioSabatoCliente: strSabVal,
                    straordinarioFestivoCliente: strFestVal,
                    straordinarioNotturnoCliente: strNottVal,
                    autorizzazioneCliente: this.autorizzazioneClienteCtrl.value ? 1 : 0,
                    attivo: true
                }
            })
            .subscribe(
                () => {
                    const txt = "Reperibilità creata con successo!";
                    this.toaster.show(txt, { classname: 'bg-success text-white' });
                    this.activeModal.close();
                },
                () => {
                    const txt = "Non è stato possibile creare la reperibilità. Contattare il supporto tecnico.";
                    this.toaster.show(txt, { classname: 'bg-danger text-white' });
                }
            );
    }
}