import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { ToastService } from "src/app/services/toast.service";
import { SegreteriaService } from "src/app/api/modulo-attivita/services";
import { AuthService } from "src/app/services/auth.service";
import { Subject, takeUntil, tap } from "rxjs";
import { GetReperibilitaCommesseTotaliResponse } from "src/app/api/modulo-attivita/models";
import { euroMask, euroMask2numStr, numStr2euroMask } from "src/app/utils/mask";

@Component({
	selector: 'app-reperibilita-creazione-dialog',
	templateUrl: './reperibilita-creazione.component.html',
    styleUrls: ['./reperibilita-creazione.component.css']
})
export class ReperibilitaCreazioneComponent implements OnInit, OnDestroy {

    @Input("reperibilita") reperibilita?: GetReperibilitaCommesseTotaliResponse;
    @Input("idSottocommessa") idSottocommessa!: number;

    dataInizioCtrl = new FormControl<string | null>(null, [Validators.required]);
    dataFineCtrl = new FormControl<string | null>(null, [Validators.required]);
    descrizioneCtrl = new FormControl<string | null>(null, [Validators.required]);

    costoReperibilitaCtrl = new FormControl<string | null>(null);

    reperibilitaSenzaAvvisoCtrl = new FormControl<boolean>(false);

    euroMask = euroMask;
    // Get euro value from field with
    //     const masked = ctrl.value!;
    //     return euroMask2numStr(masked);
    //
    // Set euro value to field with 
    //     const masked = numStr2euroMask(unmasked);
    //     ctrl.setValue(masked);
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
            reperibilitaSenzaAvviso: this.reperibilitaSenzaAvvisoCtrl
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

    ngOnInit() {
        console.log(this.reperibilita);
        if (this.reperibilita) {

            this.costoReperibilitaCtrl.setValue(
                numStr2euroMask(this.reperibilita.costoReperibilita + '')
            );

            this.form.patchValue({
                dataInizio: this.reperibilita.inizio?.slice(0, 10),
                dataFine: this.reperibilita.fine?.slice(0, 10),
                descrizione: this.reperibilita.descrizione,
                reperibilitaSenzaAvviso: !!this.reperibilita.reperibilitaSenzaAvviso
            });
        }
    }

    ngOnDestroy() {
        this.destroy$.next();
    }

    create() {

        if (this.form.invalid) return;

        const costoRep = this.costoReperibilitaCtrl.value
            ? +euroMask2numStr(this.costoReperibilitaCtrl.value)
            : null;

        this.segreteriaService
            .postReperibilitaCommesse({
                idAzienda: this.authService.user.idAzienda!,
                idLegameReperibilita: this.reperibilita ? this.reperibilita.idLegameReperibilita! : 0,
                body: {
                    inizio: this.dataInizioCtrl.value,
                    fine: this.dataFineCtrl.value,
                    idSottoCommessa: this.idSottocommessa,
                    descrizione: this.descrizioneCtrl.value,
                    costoReperibilita: costoRep,
                    reperibilitaSenzaAvviso: this.reperibilitaSenzaAvvisoCtrl.value ? 1 : 0,
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