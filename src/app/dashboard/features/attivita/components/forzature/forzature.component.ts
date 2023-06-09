import { Component, Input } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { startWith, Subject } from 'rxjs';
import { ForzaturaService } from '../../services/forzatura.service';
import { ForzaturaDto } from '../../models/forzatura';
import { ForzaturaCreazioneModifica } from '../../dialogs/forzatura-creazione-modifica/forzatura-creazione-modifica.component';
import { EliminazioneDialog } from '../../dialogs/eliminazione.dialog';
import { ToastService } from 'src/app/services/toast.service';
import { ROLES } from 'src/app/models/user';
import { AttivitaNavStateService } from '../../services/attivita-nav-state.service';

@Component({
  selector: 'app-forzature',
  templateUrl: './forzature.component.html',
  styleUrls: ['./forzature.component.css']
})
export class ForzatureComponent {

  ROLES = ROLES;

  @Input("idCommessa") idCommessa!: number;
  @Input("categoria") categoria!: "costo" | "ricavo";

  refresh$ = new Subject<void>();

  forzature: ForzaturaDto[] = [];

  constructor(
    public attivitaNavState: AttivitaNavStateService,
    private forzatureService: ForzaturaService,
    private modalService: NgbModal,
    private toaster: ToastService
  ) { }

  ngOnInit() {
    this.refresh$
      .pipe(startWith(null))
      .subscribe(() =>
        this.forzatureService
          .getForzature$(this.idCommessa, this.categoria)
          .subscribe(forzature => this.forzature = forzature)
      );
  }

  async create() {

    const modalRef = this.modalService
      .open(
        ForzaturaCreazioneModifica,
        { size: 'lg', centered: true }
      );
    
    modalRef.componentInstance.idCommessa = this.idCommessa;
    modalRef.componentInstance.categoria = this.categoria;

    await modalRef.result;

    this.refresh$.next();
  }

  async update(forzatura: ForzaturaDto) {

    const modalRef = this.modalService
      .open(
        ForzaturaCreazioneModifica,
        { size: 'lg', centered: true }
      );
    
    modalRef.componentInstance.idCommessa = this.idCommessa;
    modalRef.componentInstance.idForzatura = forzatura.id;
    modalRef.componentInstance.categoria = this.categoria;

    await modalRef.result;

    this.refresh$.next();
  }

  async delete(forzatura: ForzaturaDto) {

    const modalRef = this.modalService
      .open(
        EliminazioneDialog,
        { size: 'md', centered: true }
      );
    
    modalRef.componentInstance.name = "forzatura";
    modalRef.componentInstance.message = "Stai eliminando definitivamente una forzatura."

    await modalRef.result;

    this.forzatureService
      .deleteForzatura$(forzatura.id!, this.categoria)
      .subscribe(
        () => {
          const txt = "Forzatura eliminata con successo!";
          this.toaster.show(txt, { classname: 'bg-success text-white' });
          this.refresh$.next();
        },
        (ex) => {
          this.toaster.show(ex.error, { classname: 'bg-danger text-white' });
        }
      );
  }
}
