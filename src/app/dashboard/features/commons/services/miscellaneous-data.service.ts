import { Injectable } from '@angular/core';
import { BehaviorSubject, filter, switchMap, tap } from 'rxjs';
import { Dettaglio, UtentiAnagrafica } from 'src/app/api/modulo-attivita/models';
import { lookmap, replaceProps, singlifyLookmap } from 'src/app/utils/object';
import { CommessaService } from './commessa.service';
import { CommessaSearchDto } from '../models/commessa';
import { replaceItems } from 'src/app/utils/array';
import { HttpClient } from '@angular/common/http';
import { StatoAvanzamentoService, UtentiService } from 'src/app/api/modulo-attivita/services';
import { GetClientiParam, GetSottocommesseParam, GetUtentiParam } from '../models/autocomplete';
import { AuthService } from 'src/app/services/auth.service';

interface RefreshState {
    utenti: boolean;
    commesse: boolean;
    clienti: boolean;
};

export interface AziendaInfo {
    acronimo: string;
    descrizione: string;
    idAzienda: number;
}

@Injectable({
    providedIn: 'root'
})
export class MiscDataService {
    
    private refresh$ = new BehaviorSubject<RefreshState>({ utenti: true, commesse: true, clienti: true });

    // Lists plus lookmaps
    utenti: UtentiAnagrafica[] = [];
    idUtenteUtente: { [key: number]: UtentiAnagrafica } = {}; 

    pmList: UtentiAnagrafica[] = [];
    idPmPm: { [key: number]: UtentiAnagrafica } = {};

    bmList: UtentiAnagrafica[] = [];
    idBmBm: { [key: number]: UtentiAnagrafica } = {};

    commesse: CommessaSearchDto[] = [];
    idCommessaCommessa: { [key: number]: CommessaSearchDto } = {};

    clienti: Dettaglio[] = [];
    idClienteCliente: { [key: number]: Dettaglio } = {};

    aziende: AziendaInfo[] = [];
    idAziendaAzienda: Record<string, AziendaInfo | undefined> = {};
    
    constructor(
        private http: HttpClient,
        private authService: AuthService,
        private statoAvanzamentoService: StatoAvanzamentoService,
        private utentiService: UtentiService,
        private commesseService: CommessaService
    ) {

        console.log("MiscDataService instance", this);

        this.http.get('assets/json/id-azienda-azienda.json')
            .subscribe(rs => {
                this.aziende = Object.values(rs);
                this.idAziendaAzienda = rs as any;
            });

        this.refresh$
            .pipe(
                filter(rs => rs.utenti),
                switchMap(() =>
                    this.getUtenti$()
                ),
                tap(utenti => {
                    replaceItems(this.utenti, utenti);
                    replaceProps(
                        this.idUtenteUtente,
                        singlifyLookmap(lookmap("idUtente", utenti))
                    );
                })
            )
            .subscribe();

        this.refresh$
            .pipe(
                filter(rs => rs.utenti),
                switchMap(() =>
                    this.getUtenti$({ IsPm: true, IsBm: false })
                ),
                tap(pmList => {
                    replaceItems(this.pmList, pmList);
                    replaceProps(
                        this.idPmPm,
                        singlifyLookmap(lookmap("idUtente", pmList))
                    );
                })
            )
            .subscribe();

        this.refresh$
            .pipe(
                filter(rs => rs.utenti),
                switchMap(() =>
                    this.getUtenti$({ IsPm: false, IsBm: true })
                ),
                tap(bmList => {
                    replaceItems(this.bmList, bmList);
                    replaceProps(
                        this.idBmBm,
                        singlifyLookmap(lookmap("idUtente", bmList))
                    );
                })
            )
            .subscribe();

        this.refresh$
            .pipe(
                filter(rs => rs.commesse),
                switchMap(() =>
                    commesseService.getAllCommesse$()
                ),
                tap(commesse => {
                    replaceItems(this.commesse, commesse);
                    replaceProps(
                        this.idCommessaCommessa,
                        singlifyLookmap(lookmap("id", commesse))
                    );
                })
            )
            .subscribe();

        this.refresh$
            .pipe(
                filter(rs => rs.clienti),
                switchMap(() =>
                    this.getClienti$({ totali: true })
                ),
                tap(clienti => {
                    replaceItems(this.clienti, clienti);
                    replaceProps(
                        this.idClienteCliente,
                        singlifyLookmap(lookmap("id", clienti))
                    );
                })
            )
            .subscribe();
    }

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

    refresh(state: RefreshState) {
        this.refresh$.next(state);
    }

}
