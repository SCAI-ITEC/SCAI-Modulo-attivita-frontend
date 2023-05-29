import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { StatoAvanzamentoService, UtentiService } from 'src/app/api/modulo-attivita/services';
import { AuthService } from 'src/app/services/auth.service';
import { GetClientiParam, GetSottocommesseParam, GetUtentiParam } from '../models/autocomplete.models';
import { GetAvanzamentoParam } from '../models/stato-avanzamento.models';
import { DettaglioAvanzamento, EnumStatiChiusura, GetSottoCommesseAvanzamentoResponse } from 'src/app/api/modulo-attivita/models';
import { format } from 'date-fns';
import { guid } from 'src/app/utils/uuid';

@Injectable({
  providedIn: 'root'
})
export class StatoAvanzamentoWrapService {

  constructor(
    private authService: AuthService,
    private statoAvanzamentoService: StatoAvanzamentoService,
    private utentiService: UtentiService
  ) { }

  getUtenti$(input?: GetUtentiParam) {
    input = input || {}; // all users by default?
    input.idAzienda = this.authService.user.idAzienda;
    return this.utentiService
      .getUtenti(input as any);
  }

  getSottocommesse$(input?: GetSottocommesseParam) {
    input = input || {};
    input.idAzienda = this.authService.user.idAzienda;
    return this.statoAvanzamentoService
      .getSottoCommesse(input as any);
  }

  getClienti$(input?: GetClientiParam) {
    input = input || {};
    input.idAzienda = this.authService.user.idAzienda;
    return this.statoAvanzamentoService
      .getClienti(input as any);
  }

  private enrichAvanzamenti(avanzamenti: GetSottoCommesseAvanzamentoResponse[]) {
    return avanzamenti.map(avanzamento => {

      const dettagli = avanzamento.dettaglioAvanzamento!;

      // Add hidden state to dettaglio row
      dettagli.forEach(dettaglio => {
        const newPrototype = {
          ...Object.getPrototypeOf(dettaglio),
          _id: "dettaglio- " + guid(),
          _dirty: false
        };
        Object.setPrototypeOf(dettaglio, newPrototype);
      });

      const hasCurrMonth = dettagli.some(dettaglio => {
        const dettaglioYear = new Date(dettaglio.meseValidazione!).getFullYear();
        const dettaglioMonth = new Date(dettaglio.meseValidazione!).getMonth();
        const todayYear = new Date().getFullYear();
        const todayMonth = new Date().getMonth();
        return dettaglioYear === todayYear && dettaglioMonth === todayMonth;
      });

      const today = format(new Date(), 'yyyy-MM-dd');

      const totalProgress = dettagli.reduce((a, b) => a + b.avanzamentoTotale!, 0);

      // Add implicit
      if (!hasCurrMonth && totalProgress < 100) {
        (dettagli as any).push({
          avanzamentoTotale: 0,
          cumulato: totalProgress,
          dataAggiornamento: today,
          dataInserimento: today,
          descrizione: 'Riga autogenerata',
          idAzienda: 0, 
          idCommessa: avanzamento.commessa!.id,
          idProjectManager: avanzamento.referente!.idUtente,
          idUtenteAggiornamento: 0,
          idUtenteInserimento: 0,
          idcommessaAvanzamentiMensili: 0,
          meseValidazione: today,
          ricavoCompetenza: 0,
          costoCompetenza: 0,
          sottoCommessa: avanzamento.sottoCommessa,
          statoValidazione: {
            id: EnumStatiChiusura.Aperto,
            descrizione: 'Aperto'
          },
          valido: 1,
        });
      }

      return avanzamento;
    });
  }

  getAvanzamento$(input: GetAvanzamentoParam) {
    input = input || {};
    input.idAzienda = this.authService.user.idAzienda;
    return this.statoAvanzamentoService
      .getSottoCommesseAvanzamento(input as any)
      .pipe(
        map(this.enrichAvanzamenti.bind(this))
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
