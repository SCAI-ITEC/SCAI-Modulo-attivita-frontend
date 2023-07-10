import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommesseService, StatoAvanzamentoService, UtentiService } from 'src/app/api/modulo-attivita/services';
import { GetClientiParam, GetSottocommesseParam, GetUtentiParam } from '../models/autocomplete';
import { AuthService } from 'src/app/services/auth.service';

export interface AziendaInfo {
    acronimo: string;
    descrizione: string;
    idAzienda: number;
}

@Injectable({
    providedIn: 'root'
})
export class MiscDataService {

    aziende: AziendaInfo[] = [];
    idAziendaAzienda: Record<string, AziendaInfo | undefined> = {};
    
    constructor(
        private http: HttpClient,
        private authService: AuthService,
        private statoAvanzamentoService: StatoAvanzamentoService,
        private utentiService: UtentiService,
        private commesseService: CommesseService
    ) {

        // This is an hardcoded mock, should be substituted with a dedicated endpoint
        this.http.get('assets/json/id-azienda-azienda.json')
            .subscribe(rs => {
                this.aziende = Object.values(rs);
                this.idAziendaAzienda = rs as any;
            });
    }

    getClienti$(input?: GetClientiParam) {
        input = input || {};
        input.idAzienda = this.authService.user.idAzienda;
        input.totali = true;
        return this.statoAvanzamentoService.getClienti(input as any);
    }

    getUtenti$(input?: GetUtentiParam) {
        input = input || {};
        input.idAzienda = this.authService.user.idAzienda;
        return this.utentiService.getUtenti(input as any);
    }

    getProjectManagers$() {
        return this.getUtenti$({ IsPm: true, IsBm: false });
    }

    getBusinessManagers$() {
        return this.getUtenti$({ IsPm: false, IsBm: true });
    }

    // This returns all commesse (including sottocommesse)
    getCommesse$() {
        return this.commesseService
            .getCommesse({
                IdAzienda: this.authService.user.idAzienda,
                OrderBy: "id desc"
            });
    }

    getCommessePadre$() {
        return this.commesseService
            .getCommesse({
                IdAzienda: this.authService.user.idAzienda,
                OrderBy: "id desc",
                Where: "idCommessaPadre = null"
            });
    }

    getSottocommesse$(input?: GetSottocommesseParam) {
        input = input || {};
        input.idAzienda = this.authService.user.idAzienda;
        return this.statoAvanzamentoService.getSottoCommesse(input as any);
    }

}
