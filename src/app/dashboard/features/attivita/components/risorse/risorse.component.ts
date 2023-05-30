import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RisorsaTaskWrap, UpsertLegameParam } from '../../models/risorsa';
import { TaskDto } from '../../models/task';
import { RisorsaService } from '../../services/risorsa.service';
import { TaskService } from '../../services/task.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RisorsaCreazioneModifica } from '../../dialogs/risorsa-creazione-modifica/risorsa-creazione-modifica.component';
import { EliminazioneDialog } from '../../dialogs/eliminazione.dialog';
import { ToastService } from 'src/app/services/toast.service';
import { NEVER, Subject, catchError, lastValueFrom, startWith, switchMap, tap } from 'rxjs';
import { TaskCreazioneModifica } from '../../dialogs/task-creazione-modifica/task-creazione-modifica.component';
import { ROLES } from 'src/app/models/user';
import { AttivitaNavStateService } from '../../services/attivita-nav-state.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-risorse',
  templateUrl: './risorse.component.html',
  styleUrls: ['./risorse.component.css']
})
export class RisorseComponent {

  ROLES = ROLES;

  @Input("idCommessa") idCommessa!: number;
  @Input("idSottocommessa") idSottocommessa!: number;
  @Input("idTask") idTask!: number;
  @Output("taskUpdate") taskUpdateEmitter = new EventEmitter<TaskDto>();
  task?: TaskDto;

  refresh$ = new Subject<void>();

  risorseTask: RisorsaTaskWrap[] = [];

  constructor(
    public attivitaNavState: AttivitaNavStateService,
    private authService: AuthService,
    private taskService: TaskService,
    private risorsaService: RisorsaService,
    private modalService: NgbModal,
    private toaster: ToastService
  ) {}

  ngOnInit() {

    this.taskService
      .getTaskById$(this.idTask)
      .subscribe(task => this.task = task);

    this.refresh$
      .pipe(
        startWith(null),
        switchMap(() =>
          this.risorsaService
            .getLegamiByIdTask$(this.idTask)
        )
      )
      .subscribe(legami => this.risorseTask = legami);
  }

  async updateTask() {

		const modalRef = this.modalService
		  .open(
        TaskCreazioneModifica,
        {
          size: 'lg',
          centered: true,
          scrollable: true
        }
		  );
		modalRef.componentInstance.idCommessa = this.idCommessa;
		modalRef.componentInstance.idSottocommessa = this.idSottocommessa;
		modalRef.componentInstance.idTask = this.idTask;
	
		await modalRef.result;

		this.taskService
      .getTaskById$(this.idTask)
			.subscribe(task => {
				this.task = task;
        this.taskUpdateEmitter.emit(task);
			});
	}

  async create() {

    const modalRef = this.modalService
      .open(
        RisorsaCreazioneModifica,
        {
          size: 'lg',
          centered: true,
          scrollable: true
        }
      );
    modalRef.componentInstance.idCommessa = this.idCommessa;
    modalRef.componentInstance.idSottocommessa = this.idSottocommessa;
    modalRef.componentInstance.idTask = this.idTask;

    const result = await modalRef.result;
    this.refresh$.next();
  }

  async update(legame: RisorsaTaskWrap) {

    const modalRef = this.modalService
      .open(
        RisorsaCreazioneModifica,
        {
          size: 'lg',
          centered: true,
          scrollable: true
        }
      );
    modalRef.componentInstance.idCommessa = this.idCommessa;
    modalRef.componentInstance.idSottocommessa = this.idSottocommessa;
    modalRef.componentInstance.idTask = this.idTask;
    modalRef.componentInstance.idLegame = legame.id;

    await modalRef.result;
    this.refresh$.next();
  }

  async delete(legame: RisorsaTaskWrap) {

    const modalRef = this.modalService
      .open(
        EliminazioneDialog,
        {
          size: 'md',
          centered: true,
          scrollable: true
        }
      );
    
    const utenteCognomeNome = legame.utente.cognome + " " + legame.utente.nome;

    modalRef.componentInstance.name = this.task?.codiceTask + " - " + utenteCognomeNome;
    modalRef.componentInstance.message = "Stai eliminando definitivamente un legame task-risorsa."

    await modalRef.result;

    this.risorsaService
      .deleteLegame$(legame.id, legame.idUtente)
      .subscribe(
        () => {

          const txt = "Legame eliminato con successo!";
          this.toaster.show(txt, { classname: 'bg-success text-white' });

          this.refresh$.next();
        },
        (ex) => {
          this.toaster.show(ex.error, { classname: 'bg-danger text-white' });
        }
      );
  }

  async autoassign() {
    
    const { idUtente } = this.authService.user;

    const legameTaskRisorsa: UpsertLegameParam = {
      idUtente: idUtente!,
      idTask: this.idTask
    };

    await lastValueFrom(
      this.risorsaService
        .createLegame$(legameTaskRisorsa)
        .pipe(
          catchError(() => {
            const txt = "Non è stato possibile creare il Legame per la tua utenza. Contattare il supporto tecnico.";
            this.toaster.show(txt, { classname: 'bg-danger text-white' });
            return NEVER;
          }),
          tap(() => {
            const txt = "Legame creato con successo!";
            this.toaster.show(txt, { classname: 'bg-success text-white' });
            this.refresh$.next();
          })
        )
    );
  }

}
