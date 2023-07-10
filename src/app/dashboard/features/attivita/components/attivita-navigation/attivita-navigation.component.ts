import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { combineLatest } from 'rxjs';
import { GetCommessaResponse } from 'src/app/api/modulo-attivita/models';
import { CommessaCreazioneModifica } from '../../dialogs/commessa-creazione-modifica/commessa-creazione-modifica.component';
import { Offerta } from '../../models/offerta';
import { OffertaService } from '../../services/offerta.service';
import { CommesseService } from 'src/app/api/modulo-attivita/services';
import { ROLES } from 'src/app/models/user';
import { AttivitaNavStateService } from '../../services/attivita-nav-state.service';

@Component({
  selector: 'app-attivita-navigation',
  templateUrl: './attivita-navigation.component.html',
  styleUrls: ['./attivita-navigation.component.css'],
  providers: [ AttivitaNavStateService ]
})
export class AttivitaNavigationComponent {

	ROLES = ROLES;

  	@Input("idCommessa") idCommessa!: number;
	@Output("commessaUpdate") commessaUpdateEmitter = new EventEmitter<GetCommessaResponse>();
	commessa?: GetCommessaResponse;

  	activeTabId?: number;
	offerta?: Offerta;
	hasSottocommesse = false;

	constructor(
		private attivitaNavState: AttivitaNavStateService,
		private commesseService: CommesseService,
		private offertaService: OffertaService,
		private modalService: NgbModal
	) { }

	ngOnInit() {

		combineLatest([
			this.commesseService.getCommessa({ id: this.idCommessa }),
			this.offertaService.getOffertaByIdCommessa$(this.idCommessa),
			this.commesseService.getCommesse({ IdPadre: this.idCommessa })
		])
		.subscribe(async ([ commessa, offerta, sottocommesse ]) => {

			this.attivitaNavState.commessa = commessa;
			this.commessa = commessa;
			this.offerta = offerta;

			this.hasSottocommesse = !!sottocommesse.length;

			if (this.commessa.tipoAttivita?.id === 2) {
				this.activeTabId = 3;
			}
			else if (!offerta.dataAccettazione) {
				this.activeTabId = 2;
			}
			else {
				this.activeTabId = 3;
			}
		});
	}

	async update() {

		const modalRef = this.modalService
		  .open(
			CommessaCreazioneModifica,
			{ size: "lg", centered: true }
		  );
		
		modalRef.componentInstance.idCommessa = this.idCommessa;
	
		await modalRef.result;

		this.commesseService
			.getCommessa({ id: this.idCommessa })
			.subscribe(commessa => {
				this.commessa = commessa;
				this.commessaUpdateEmitter.emit(commessa);
			});
	}

	onOffertaUpsert(offerta: Offerta) {

		const prevDataAccettazione = this.offerta?.dataAccettazione;

		this.offerta = offerta;

		// If there was no data accettazione previously but now there is navigate to sottocommesse
		if (!prevDataAccettazione && offerta.dataAccettazione) {
			setTimeout(() => this.activeTabId = 3, 200);
		}
	}

}
