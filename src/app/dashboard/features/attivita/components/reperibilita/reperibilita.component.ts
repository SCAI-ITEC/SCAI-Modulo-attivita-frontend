import { Component, Input } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject, startWith } from 'rxjs';
import { ReperibilitaCreazioneComponent } from '../../dialogs/reperibilita-creazione/reperibilita-creazione.component';
import { SegreteriaService } from 'src/app/api/modulo-attivita/services';
import { AuthService } from 'src/app/services/auth.service';
import { GetReperibilitaCommesseTotaliResponse } from 'src/app/api/modulo-attivita/models';
import { ToastService } from 'src/app/services/toast.service';
import { EliminazioneDialog } from '../../dialogs/eliminazione.dialog';

@Component({
  selector: 'app-reperibilita',
  templateUrl: './reperibilita.component.html',
  styleUrls: ['./reperibilita.component.css']
})
export class ReperibilitaComponent {

  @Input("idCommessa") idCommessa!: number;
  @Input("idSottocommessa") idSottocommessa!: number;

  refresh$ = new Subject<void>();

  reperibilita: GetReperibilitaCommesseTotaliResponse[] = [];

  constructor(
    private authService: AuthService,
    private segreteriaService: SegreteriaService,
    private modalService: NgbModal,
    private toaster: ToastService
  ) { }

  ngOnInit() {
    this.refresh$
      .pipe(startWith(null))
      .subscribe(() =>
        this.segreteriaService
          .getReperibilitaCommesseTotali({
            idAzienda: this.authService.user.idAzienda!,
            idSottoCommessa: this.idSottocommessa
          })
          .subscribe(reperibilita => this.reperibilita = reperibilita)
      );
  }

  async create() {

    const modalRef = this.modalService
      .open(
        ReperibilitaCreazioneComponent,
        {
          size: 'lg',
          centered: true,
          scrollable: true
        }
      );
    modalRef.componentInstance.idSottocommessa = this.idSottocommessa;

    const result = await modalRef.result;
    this.refresh$.next();
  }

  async delete(reperibilita: GetReperibilitaCommesseTotaliResponse) {

    const modalRef = this.modalService
      .open(
        EliminazioneDialog,
        {
          size: 'md',
          centered: true,
          scrollable: true
        }
      );
    modalRef.componentInstance.name = reperibilita.descrizione;
    modalRef.componentInstance.message = "Stai eliminando definitivamente una reperibilità."

    await modalRef.result;
    
    this.segreteriaService
      .postReperibilitaCommesse({
        idAzienda: this.authService.user.idAzienda!,
        idLegameReperibilita: reperibilita.idLegameReperibilita!,
        body: {
          attivo: false
        }
      })
      .subscribe(
        () => {
          const txt = "Reperibilità eliminata con successo!";
          this.toaster.show(txt, { classname: 'bg-success text-white' });
          this.refresh$.next();
        },
        () => {
          const txt = "Non è stato possibile eliminare la reperibilità. Contattare il supporto tecnico.";
          this.toaster.show(txt, { classname: 'bg-danger text-white' });
        }
      )
  }
}
