import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { StatoAvanzamentoService } from 'src/app/api/modulo-attivita/services';
import { AuthService } from 'src/app/services/auth.service';
import { GetAvanzamentoParam } from '../models/stato-avanzamento';
import { DettaglioAvanzamento, EnumStatiChiusura, GetSottoCommesseAvanzamentoResponse } from 'src/app/api/modulo-attivita/models';
import { format } from 'date-fns';
import { guid } from 'src/app/utils/uuid';

@Injectable({
  providedIn: 'root'
})
export class StatoAvanzamentoWrapService {

  constructor(
    private authService: AuthService,
    private statoAvanzamentoService: StatoAvanzamentoService
  ) { }

  getAvanzamento$(input: GetAvanzamentoParam) {
    input = input || {};
    input.idAzienda = this.authService.user.idAzienda;
    return this.statoAvanzamentoService
      .getSottoCommesseAvanzamento(input as any);
  }

  postAvanzamento$(dettaglio: DettaglioAvanzamento) {
    return this.statoAvanzamentoService
      .postCommesseAvanzamento({
        idAzienda: this.authService.user.idAzienda!,
        IdAvanzamento: dettaglio.idcommessaAvanzamentiMensili!,
        body: {
          idSottoCommessa: dettaglio.sottoCommessa!.id,
          avanzamento: dettaglio.avanzamentoTotale,
          descrizione: "Modulo Attività - Stato Avanzamento",
          statoValidazione: dettaglio.statoValidazione!.id,
          idAzienda: this.authService.user.idAzienda,
          idProjectManager: dettaglio.idProjectManager,
          ricavoCompetenza: dettaglio.ricavoCompetenza,
          dataAggiornamento: dettaglio.dataAggiornamento,
          meseValidazione: dettaglio.meseValidazione,
          valido: !!dettaglio.valido
        }
      });
  }
}
