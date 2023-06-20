import { Injectable } from '@angular/core';
import { StatoAvanzamentoService } from 'src/app/api/modulo-attivita/services';
import { AuthService } from 'src/app/services/auth.service';
import { GetAvanzamentoParam } from '../models/stato-avanzamento';
import { DettaglioAvanzamento } from 'src/app/api/modulo-attivita/models';
import { tap } from 'rxjs';
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
      .getSottoCommesseAvanzamento(input as any)
      .pipe(
        tap(avanzamenti =>
          // Enrich dettaglioAvanzamento with presentational fields
          avanzamenti.forEach(avanzamento =>
            avanzamento.dettaglioAvanzamento?.forEach(dettaglio =>
              Object.setPrototypeOf(
                dettaglio,
                {
                  ...Object.getPrototypeOf(dettaglio),
                  _id: guid(),
                  _dirty: false
                }
              )  
            )  
          )
        )
      );
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
