import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject, startWith, switchMap } from 'rxjs';
import { GetDiarieResponse } from 'src/app/api/modulo-attivita/models';
import { TipiTrasfertaService } from 'src/app/api/modulo-attivita/services';
import { ToastService } from 'src/app/services/toast.service';
import { EliminazioneDialog } from '../../attivita/dialogs/eliminazione.dialog';
import { AbilitazioneDiariaCreazioneComponent } from '../dialogs/abilitazione-diaria-creazione/abilitazione-diaria-creazione.component';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-abilitazione-diaria-azienda',
  templateUrl: './abilitazione-diaria-azienda.component.html',
  styleUrls: ['./abilitazione-diaria-azienda.component.css']
})
export class AbilitazioneDiariaAziendaComponent {
  refresh$ = new Subject<void>();
  
  assegnazioniDiarie: GetDiarieResponse[] = [];

  constructor(
    private trasfertaService: TipiTrasfertaService,
    private authService: AuthService,
    private modalService: NgbModal,
    private toaster: ToastService
  ) { }

  ngOnInit() {
    this.refresh$
      .pipe(
        startWith(null),
        switchMap(() =>
          this.trasfertaService
            .getDiarie({ IdAzienda: this.authService.user.idAzienda! })
            
        )
      )
      .subscribe(diarie => this.assegnazioniDiarie = diarie);
  }

  async create() {

    const modalRef = this.modalService
      .open(
        AbilitazioneDiariaCreazioneComponent,
        {
          size: 'lg',
          centered: true
        }
      );

    const result = await modalRef.result;
    this.refresh$.next();
  }

  async delete(assegnazioneDiaria: GetDiarieResponse) {

    const modalRef = this.modalService
      .open(
        EliminazioneDialog,
        {
          size: 'md',
          centered: true,
          scrollable: true
        }
      );
    modalRef.componentInstance.name = assegnazioneDiaria.azienda?.descrizione + " - " + assegnazioneDiaria.tipoTrasferta?.descrizione;
    modalRef.componentInstance.message = "Stai eliminando definitivamente l'assegnazione della diaria."

    await modalRef.result;

    this.trasfertaService
      .deleteDiarie({ id: assegnazioneDiaria.id! })
      .subscribe(
        () => {
          const txt = "Assegnazione diaria eliminata con successo!";
          this.toaster.show(txt, { classname: 'bg-success text-white' });
          this.refresh$.next();
        },
        (ex) => {
          this.toaster.show(ex.error, { classname: 'bg-danger text-white' });
        }
      );
  }

  async update(assegnazioneDiaria: GetDiarieResponse) {
    this.trasfertaService
      .deleteDiarie({ id: assegnazioneDiaria.id! })
      .subscribe(
        () => {
          const txt = "Abilitazione diaria ripristinata con successo!";
          this.toaster.show(txt, { classname: 'bg-success text-white' });
          this.refresh$.next();
        },
        (ex) => {
          this.toaster.show(ex.error, { classname: 'bg-danger text-white' });
        }
      );
  }

}
