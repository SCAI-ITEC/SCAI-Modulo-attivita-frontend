import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TaskService } from './task.service';
import { RisorsaService } from './risorsa.service';
import { TaskDto } from '../models/task';
import { CommessaDto, CreateSottocommessaParam } from '../../commons/models/commessa';
import { CommesseService, LegamiTaskUtenteService } from 'src/app/api/modulo-attivita/services';
import { EnumTipiFatturazione, EnumTipoAttivita, GetCommessaResponse } from 'src/app/api/modulo-attivita/models';
import { jsonCopy } from 'src/app/utils/json';

@Injectable({
    providedIn: 'root'
})
export class SottocommessaService {

    constructor(
        private http: HttpClient,
        private commesseService: CommesseService,
        private taskService: TaskService,
        private legamiTaskUtenteService: LegamiTaskUtenteService
    ) { }

    // checkExistingSottocommesseByIdCommessa$(idCommessa: number) {
    //     const url = `${environment.scaiRoot}/modulo-attivita-be/commesse/check-exist-sottocommesse/${idCommessa}`;
    //     return this.http.get<boolean>(url);
    // }

    // getSottocommesseByIdCommessa$(idCommessa: number) {
    //     const url = `${environment.scaiRoot}/modulo-attivita-be/commesse/by-padre/id/${idCommessa}`;
    //     return this.http
    //         .get<CommessaDto[]>(url)
    //         .pipe(map(sottocommesse => sottocommesse.reverse()))
    // }

    // getSottocommessaById$(idSottocommessa: number) {
    //     const url = `${environment.scaiRoot}/modulo-attivita-be/commesse/id/${idSottocommessa}`;
    //     return this.http.get<CommessaDto>(url);
    // }

    // getIniziative$(
    //     clienteDiretto: number,
    //     clienteFinale: number,
    //     idBm: number
    // ) {
    //     const url = `${environment.scaiRoot}/common-core-service/findIniziativa`;
    //     return this.http.post<string[]>(url, {
    //         terzaParteDiretta: clienteDiretto,
    //         terzaParteFinale: clienteFinale,
    //         idBusinessManager: idBm
    //     });
    // }

    // createSottocommessa$(input: CreateSottocommessaParam) {
    //     const url = `${environment.scaiRoot}/modulo-attivita-be/commesse/save`;
    //     return this.http.post<number>(url, input);
    // }

    // updateSottocommessa$(idSottocommessa: number, sottocommessa: CommessaDto) {
    //     const url = `${environment.scaiRoot}/modulo-attivita-be/commesse/update/id/${idSottocommessa}`;
    //     return this.http.put<number>(url, sottocommessa);
    // }

    // deleteSottocommessa$(idSottocommessa: number) {
    //     const url = `${environment.scaiRoot}/modulo-attivita-be/commesse/deleteSottocommessa/id/${idSottocommessa}`;
    //     return this.http.delete(url);
    // }

    async duplicateSottocommessa(sottocommessa: GetCommessaResponse) {

        // Copy sottocommessa
        const _sottocommessa = jsonCopy(sottocommessa) as GetCommessaResponse;

        // Get all the tasks of the given sottocommessa
        const tasks = await lastValueFrom(
            this.taskService
                .getTasksByIdSottocommessa$(_sottocommessa.id!)
        );

        // Remove the id from the copy of sottocommessa
        delete _sottocommessa.id;

        // Get the ID of a newly created sottocommessa
        const { id } = await lastValueFrom(
            this.commesseService
                .postCommessa({
                    body: {
                        ..._sottocommessa,
                        codiceCommessa: `Copia di ${_sottocommessa.codiceCommessa}`,
                        idProjectManager: _sottocommessa.projectManager?.id,
                        idTipoFatturazione: _sottocommessa.tipoFatturazione?.id as unknown as EnumTipiFatturazione
                    }
                })
        );

        // Duplicate tasks into the newly created sottocommessa
        for (let i = 0; i < tasks.length; i++) {
            this.duplicateTask(id!, tasks[i])
        }
    }

    async duplicateTask(idSottocommessa: number, task: TaskDto) {

        // Get all the risorse of the given task
        const risorse = await lastValueFrom(
            this.legamiTaskUtenteService
                .getLegami({ idTask: task.id })
        );

        // Get the ID of a newly created task
        const idTask = await lastValueFrom(
            this.taskService
                .createTask$({
                    attivitaObbligatoria: task.attivitaObbligatoria,
                    codiceTask: `Copia di ${task.codiceTask || "task senza codice"}`,
                    dataFine: task.dataFine,
                    dataInizio: task.dataInizio,
                    descrizione: task.descrizione,
                    giorniPrevisti: task.giorniPrevisti,
                    idCommessa: idSottocommessa,
                    percentualeAvanzamento: task.percentualeAvanzamento,
                    stimaGiorniAFinire: task.stimaGiorniAFinire,
                    visualizzataInRapportini: task.visualizzataInRapportini,
                })
        );

        // Duplicate risorse into the newly created task
        for (let j = 0; j < risorse.length; j++) {
            await lastValueFrom(
                this.legamiTaskUtenteService
                    .postLegame({
                        body: {
                            idTask,
                            idAzienda: risorse[j].idAzienda!,
                            idUtente: risorse[j].utente?.idUtente,
                            idDiaria: risorse[j].diaria?.id,
                            inizio: risorse[j].inizio,
                            fine: risorse[j].fine,
                        }
                    })
            )
        }
    }

}
