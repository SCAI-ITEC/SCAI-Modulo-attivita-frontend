import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SottocommessaService } from '../../services/sottocommessa.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SottocommessaCreazioneModifica } from '../../dialogs/sottocommessa-creazione-modifica/sottocommessa-creazione-modifica.component';
import { UtentiAnagrafica } from 'src/app/api/modulo-attivita/models';
import { ROLES } from 'src/app/models/user';
import { AttivitaNavStateService } from '../../services/attivita-nav-state.service';
import { MiscDataService } from '../../../commons/services/miscellaneous-data.service';
import { CommessaDto } from '../../../commons/models/commessa';

@Component({
  selector: 'app-sottocommessa-navigation',
  templateUrl: './sottocommessa-navigation.component.html',
  styleUrls: ['./sottocommessa-navigation.component.css']
})
export class SottocommessaNavigationComponent {

  ROLES = ROLES;

  @Input("idCommessa") idCommessa!: number;
  @Input("idSottocommessa") idSottocommessa!: number;
  @Output("sottocommessaUpdate") sottocommessaUpdateEmitter = new EventEmitter<CommessaDto>();
  sottocommessa?: CommessaDto;

  pm?: UtentiAnagrafica;

  activeTabId?: number;

  constructor(
    public attivitaNavState: AttivitaNavStateService,
    private sottocommessaService: SottocommessaService,
    private miscDataService: MiscDataService,
    private modalService: NgbModal
  ) {}

  ngOnInit() {
    this.sottocommessaService
      .getSottocommessaById$(this.idSottocommessa)
      .subscribe(sottocommessa => {
        this.sottocommessa = sottocommessa;
        this.pm = this.miscDataService.idUtenteUtente[sottocommessa?.idProjectManager];
      });
  }

  async updateSottocommessa() {

		const modalRef = this.modalService
		  .open(
        SottocommessaCreazioneModifica,
        {
          size: 'lg',
          centered: true
        }
		  );
		modalRef.componentInstance.idCommessa = this.idCommessa;
		modalRef.componentInstance.idSottocommessa = this.idSottocommessa;
	
		await modalRef.result;

		this.sottocommessaService
			.getSottocommessaById$(this.idSottocommessa)
			.subscribe(sottocommessa => {
				this.sottocommessa = sottocommessa;
        this.pm = this.miscDataService.idUtenteUtente[sottocommessa?.idProjectManager];
        this.sottocommessaUpdateEmitter.emit(sottocommessa);
			});
	}

}
