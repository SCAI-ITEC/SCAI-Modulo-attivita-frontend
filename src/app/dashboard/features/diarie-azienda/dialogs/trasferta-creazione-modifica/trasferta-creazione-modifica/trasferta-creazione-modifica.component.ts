import { Component, Input } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
import { GetTipiTrasfertaResponse } from 'src/app/api/modulo-attivita/models';
import { TipiTrasfertaService } from 'src/app/api/modulo-attivita/services';
import { DIALOG_MODE } from 'src/app/dashboard/features/attivita/models/dialog';
import { ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'app-trasferta-creazione-modifica',
  templateUrl: './trasferta-creazione-modifica.component.html',
  styleUrls: ['./trasferta-creazione-modifica.component.css']
})
export class TrasfertaCreazioneModificaComponent {

  @Input("tipoTrasferta")
  tipoTrasferta!: GetTipiTrasfertaResponse;

  DIALOG_MODE = DIALOG_MODE;
  dialogMode!: DIALOG_MODE;

  codiceFoglioStipendiCtrl = new FormControl<string | null>(null, [Validators.required]);
  codiceEstesoFoglioStipendiCtrl = new FormControl<string | null>(null, [Validators.required]);
  dataInizioCtrl = new FormControl<string | null>(null);
  dataFineCtrl = new FormControl<string | null>(null);
  descrizioneCtrl = new FormControl<string | null>(null, [Validators.required]);

  datesValidator = () => {
    const isoInizio = this.dataInizioCtrl.value || "";
    const isoFine = this.dataFineCtrl.value || "";

    if (isoFine && isoInizio > isoFine)
      return { dates: "Invalid range." };
    
    return null;
  };

  form = new FormGroup(
    {
      codiceFoglioStipendi: this.codiceFoglioStipendiCtrl,
      codiceEstesoFoglioStipendi: this.codiceEstesoFoglioStipendiCtrl,
      dataInizio: this.dataInizioCtrl,
      dataFine: this.dataFineCtrl,
      descrizione: this.descrizioneCtrl,
    },
    [ this.datesValidator ]
  );

  destroy$ = new Subject<void>();

  constructor(
    public activeModal: NgbActiveModal,
    private trasfertaService: TipiTrasfertaService,
    private toaster: ToastService
  ) { }

  ngOnInit(){
    this.dialogMode = this.tipoTrasferta
      ? DIALOG_MODE.Update
      : DIALOG_MODE.Create;
    
    if (this.dialogMode === DIALOG_MODE.Update) {
      this.initCtrlValues();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
  }
  
  initCtrlValues() {
    if (!this.tipoTrasferta) return;

    this.codiceFoglioStipendiCtrl.setValue(this.tipoTrasferta.codiceFoglioStipendi!);
    this.codiceEstesoFoglioStipendiCtrl.setValue(this.tipoTrasferta.codiceEstesoFoglioStipendi!);
    this.dataInizioCtrl.setValue(this.tipoTrasferta.inizioValidita!);
    this.dataFineCtrl.setValue(this.tipoTrasferta.fineValidita!);
    this.descrizioneCtrl.setValue(this.tipoTrasferta.descrizione!);
  }

  save() {
    if (this.dialogMode === DIALOG_MODE.Create)
      this.create();
    else
      this.update();
  }

  create() {

    if (this.form.invalid) return;

    this.trasfertaService
        .postTipiTrasferta({
            body: this.form.value
        })
        .subscribe(
            () => {
                const txt = "Tipo trasferta creato con successo!";
                this.toaster.show(txt, { classname: 'bg-success text-white' });
                this.activeModal.close();
            },
            () => {
                const txt = "Non è stato possibile creare il tipo trasferta. Contattare il supporto tecnico.";
                this.toaster.show(txt, { classname: 'bg-danger text-white' });
            }
        );
  }

  update() {
    if (this.form.invalid) return;

    this.trasfertaService
        .patchTipiTrasferta({
            id: this.tipoTrasferta.id!,
            body: this.form.value
        })
        .subscribe(
            () => {
                const txt = "Tipo trasferta modificato con successo!";
                this.toaster.show(txt, { classname: 'bg-success text-white' });
                this.activeModal.close();
            },
            () => {
                const txt = "Non è stato possibile modificare il tipo trasferta. Contattare il supporto tecnico.";
                this.toaster.show(txt, { classname: 'bg-danger text-white' });
            }
        );
  }

}
