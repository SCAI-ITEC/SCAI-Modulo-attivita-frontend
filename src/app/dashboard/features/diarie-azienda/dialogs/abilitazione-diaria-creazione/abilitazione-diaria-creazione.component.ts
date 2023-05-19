import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TipiTrasfertaService } from 'src/app/api/modulo-attivita/services';
import { ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'app-abilitazione-diaria-creazione',
  templateUrl: './abilitazione-diaria-creazione.component.html',
  styleUrls: ['./abilitazione-diaria-creazione.component.css']
})
export class AbilitazioneDiariaCreazioneComponent {


  constructor(
    public activeModal: NgbActiveModal,
    private trasfertaService: TipiTrasfertaService,
    private toaster: ToastService
  ) { }

}
