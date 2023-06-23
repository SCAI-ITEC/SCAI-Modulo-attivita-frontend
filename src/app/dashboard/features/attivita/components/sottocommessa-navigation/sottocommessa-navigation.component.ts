import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SottocommessaCreazioneModifica } from '../../dialogs/sottocommessa-creazione-modifica/sottocommessa-creazione-modifica.component';
import { GetCommessaResponse } from 'src/app/api/modulo-attivita/models';
import { ROLES } from 'src/app/models/user';
import { AttivitaNavStateService } from '../../services/attivita-nav-state.service';
import { CommesseService } from 'src/app/api/modulo-attivita/services';

@Component({
  selector: 'app-sottocommessa-navigation',
  templateUrl: './sottocommessa-navigation.component.html',
  styleUrls: ['./sottocommessa-navigation.component.css']
})
export class SottocommessaNavigationComponent {

  ROLES = ROLES;

  @Input("idCommessa") idCommessa!: number;
  @Input("idSottocommessa") idSottocommessa!: number;
  @Output("sottocommessaUpdate") sottocommessaUpdateEmitter = new EventEmitter<GetCommessaResponse>();
  sottocommessa?: GetCommessaResponse;

  activeTabId?: number;

  constructor(
    public attivitaNavState: AttivitaNavStateService,
    private commesseService: CommesseService,
    private modalService: NgbModal
  ) {}

  ngOnInit() {
    this.commesseService
      .getCommessa({ id: this.idSottocommessa })
      .subscribe(sottocommessa => {
        this.sottocommessa = sottocommessa;
      });
  }

  async updateSottocommessa() {

		const modalRef = this.modalService
		  .open(
        SottocommessaCreazioneModifica,
        { size: "lg", centered: true }
		  );
    
		modalRef.componentInstance.idCommessa = this.idCommessa;
		modalRef.componentInstance.idSottocommessa = this.idSottocommessa;
	
		await modalRef.result;

		this.commesseService
      .getCommessa({ id: this.idSottocommessa })
			.subscribe(sottocommessa => {
				this.sottocommessa = sottocommessa;
        this.sottocommessaUpdateEmitter.emit(sottocommessa);
			});
	}

}
