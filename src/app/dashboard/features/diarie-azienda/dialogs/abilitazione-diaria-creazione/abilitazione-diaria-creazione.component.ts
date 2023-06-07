import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject, startWith, switchMap } from 'rxjs';
import { TipiTrasfertaService } from 'src/app/api/modulo-attivita/services';
import { ToastService } from 'src/app/services/toast.service';
import { AuthService } from 'src/app/services/auth.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { GetTipiTrasfertaResponse } from 'src/app/api/modulo-attivita/models';
import { euroMask, euroMask2numStr } from 'src/app/utils/mask';

@Component({
  selector: 'app-abilitazione-diaria-creazione',
  templateUrl: './abilitazione-diaria-creazione.component.html',
  styleUrls: ['./abilitazione-diaria-creazione.component.css']
})
export class AbilitazioneDiariaCreazioneComponent {

  refresh$ = new Subject<void>();

  diariaCtrl = new FormControl<number | null>(null, [Validators.required]);

  tipiTrasferte: GetTipiTrasfertaResponse[] = [];
  tipoTrasfertaFormatter = (c: GetTipiTrasfertaResponse) => c.descrizione;
  tipoTrasfertaCtrl = new FormControl<GetTipiTrasfertaResponse | null>(null, [Validators.required]);
  
  form = new FormGroup({
    tipoTrasferta: this.tipoTrasfertaCtrl,
    diaria: this.diariaCtrl
  });

  euroMask = euroMask;
  
  constructor(
    public activeModal: NgbActiveModal,
    private authService: AuthService,
    private trasfertaService: TipiTrasfertaService,
    private toaster: ToastService,
    
  ){}

  ngOnInit() {
    this.refresh$
      .pipe(
        startWith(null),
        switchMap(() =>
          this.trasfertaService
            .getTipiTrasferta()
        )
      )
      .subscribe(tipiTrasferte => this.tipiTrasferte = tipiTrasferte);
  }

  create() {

    if (this.form.invalid) return;

    var associazioneDiaria = {
      diaria: Number(euroMask2numStr(this.diariaCtrl.value+"")),
      idAzienda: this.authService.user.idAzienda,
      idTipoTrasferta: this.tipoTrasfertaCtrl.value?.id
    }

    this.trasfertaService
      .postDiarie({
        body: associazioneDiaria,
      })
      .subscribe(
        () => {
          const txt = "Assegnazione diaria avvenuta con successo!";
          this.toaster.show(txt, { classname: 'bg-success text-white' });
          this.activeModal.close();
        },
        () => {
          const txt = "Non è stato possibile assegnare la diaria. Contattare il supporto tecnico.";
          this.toaster.show(txt, { classname: 'bg-danger text-white' });
        }
      );
  }
}
