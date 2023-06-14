import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject, map, startWith, switchMap } from 'rxjs';
import { GetTipiTrasfertaResponse } from 'src/app/api/modulo-attivita/models';
import { TipiTrasfertaService } from 'src/app/api/modulo-attivita/services';
import { ToastService } from 'src/app/services/toast.service';
import { EliminazioneDialog } from '../../attivita/dialogs/eliminazione.dialog';
import { TipoTrasfertaCreazioneModificaComponent } from '../dialogs/tipo-trasferta-creazione-modifica/tipo-trasferta-creazione-modifica.component';

@Component({
  selector: 'app-creazione-tipo-trasferta',
  templateUrl: './creazione-tipo-trasferta.component.html',
  styleUrls: ['./creazione-tipo-trasferta.component.css']
})
export class CreazioneTipoTrasfertaComponent {

  refresh$ = new Subject<void>();
  
  tipiTrasferte: GetTipiTrasfertaResponse[] = [];

  constructor(
    private trasfertaService: TipiTrasfertaService,
    private modalService: NgbModal,
    private toaster: ToastService
  ) { }

  ngOnInit() {
    this.refresh$
      .pipe(
        startWith(null),
        switchMap(() =>
          this.trasfertaService
            .getTipiTrasferta()
            .pipe(
              map(response =>
                response.map(tipoTrasferta =>
                  ({
                    ...tipoTrasferta,
                    inizioValidita: tipoTrasferta.inizioValidita || "",
                    fineValidita: tipoTrasferta.fineValidita || "",
                  }))
                )
            )
        )
      )
      .subscribe(tipiTrasferte => this.tipiTrasferte = tipiTrasferte);
  }

  async create() {

    const modalRef = this.modalService
      .open(
        TipoTrasfertaCreazioneModificaComponent,
        {
          size: 'lg',
          centered: true
        }
      );

    const result = await modalRef.result;
    this.refresh$.next();
  }

  async update(tipoTrasferta: GetTipiTrasfertaResponse) {

    const modalRef = this.modalService
      .open(
        TipoTrasfertaCreazioneModificaComponent,
        {
          size: 'lg',
          centered: true
        }
      );
    modalRef.componentInstance.tipoTrasferta = tipoTrasferta;

    await modalRef.result;
    this.refresh$.next();
  }

  async delete(tipoTrasferta: GetTipiTrasfertaResponse) {

    const modalRef = this.modalService
      .open(
        EliminazioneDialog,
        {
          size: 'md',
          centered: true
        }
      );
    modalRef.componentInstance.name = tipoTrasferta.descrizione;
    modalRef.componentInstance.message = "Stai eliminando definitivamente un tipo trasferta."

    await modalRef.result;

    this.trasfertaService
      .deleteTipiTrasferta({ id: tipoTrasferta.id! })
      .subscribe(
        () => {
          const txt = "Tipo trasferta eliminato con successo!";
          this.toaster.show(txt, { classname: 'bg-success text-white' });
          this.refresh$.next();
        },
        (ex) => {
          this.toaster.show(ex.error, { classname: 'bg-danger text-white' });
        }
      );
  }

}
