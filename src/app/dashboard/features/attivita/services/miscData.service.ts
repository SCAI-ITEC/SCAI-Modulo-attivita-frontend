import { Injectable } from '@angular/core';
import { BehaviorSubject, filter, switchMap, tap } from 'rxjs';
import { Dettaglio, UtentiAnagrafica } from 'src/app/api/modulo-attivita/models';
import { lookmap, replaceProps, singlifyLookmap } from 'src/app/utils/object';
import { StatoAvanzamentoWrapService } from '../../stato-avanzamento/services/stato-avanzamento-wrap.service';
import { CommessaService } from './commessa.service';
import { CommessaSearchDto } from '../models/commessa';
import { replaceItems } from 'src/app/utils/array';
import { HttpClient } from '@angular/common/http';

interface RefreshState {
    utenti: boolean;
    commesse: boolean;
    clienti: boolean;
};

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

    idAziendaAzienda: Record<string, any> = {};

    constructor(
        private http: HttpClient,
        private statoAvanzamentoWrap: StatoAvanzamentoWrapService,
        private commesseService: CommessaService
    ) {

        console.log("MiscDataService instance", this);

        this.http.get('assets/json/id-azienda-azienda.json')
            .subscribe(res => this.idAziendaAzienda = res);

        this.refresh$
            .pipe(
                filter(rs => rs.utenti),
                switchMap(() =>
                    statoAvanzamentoWrap.getUtenti$()
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
                    statoAvanzamentoWrap.getUtenti$({ IsPm: true, IsBm: false })
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
                    statoAvanzamentoWrap.getUtenti$({ IsPm: false, IsBm: true })
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
                    statoAvanzamentoWrap.getClienti$({ totali: true })
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

    refresh(state: RefreshState) {
        this.refresh$.next(state);
    }

}

