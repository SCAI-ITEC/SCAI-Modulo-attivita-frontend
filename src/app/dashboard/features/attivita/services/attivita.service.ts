import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { environment } from 'src/environments/environment';
import { Commessa, CommessaDto, CommessaSearchDto, CreateCommessaParam, GetAllCommesseParam, OpportunitaDto, UpdateCommessaParam } from '../models/attivita.models';

@Injectable({
  providedIn: 'root'
})
export class AttivitaService {

  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) { }

  getAllCommesse$(input?: GetAllCommesseParam) {
    input = input || {};
    const url = `${environment.attivitaApiRoot}/modulo-attivita-be/commesse/all-padre/id-azienda/${this.authService.user.idAzienda}`;
    return this.http.post<CommessaSearchDto[]>(url, input);
  }

  getCommesseAutocomplete$(input?: GetAllCommesseParam): Observable<Commessa[]> {
    input = input || {};
    const url = `${environment.attivitaApiRoot}/modulo-attivita-be/commesse/all-padre/id-azienda/${this.authService.user.idAzienda}`;
    return this.http.post<CommessaSearchDto[]>(url, input)
      .pipe(
        map(commesse =>
          commesse.map(({ id, codiceCommessa: codice, descrizione }) =>
            ({ id, codice, descrizione })
          )
        )
      );
  }

  getCommessaById(idCommessaPadre: number) {
    const url = `${environment.attivitaApiRoot}/modulo-attivita-be/commesse/id/${idCommessaPadre}/id-azienda/${this.authService.user.idAzienda}`;
    return this.http.get<CommessaDto>(url);
  }

  createCommessa$(input: CreateCommessaParam){
    input.idAzienda = this.authService.user.idAzienda;
    input.idUtenteInserimento = this.authService.user.idUtente;
    const url = `${environment.attivitaApiRoot}/modulo-attivita-be/save/opportunita`;
    return this.http.post<OpportunitaDto>(url, input);
  }

  updateCommessa$(commessa: UpdateCommessaParam) {
    const url = `${environment.attivitaApiRoot}/modulo-attivita-be/commesse/update/id/${commessa.id}`;
    return this.http.put<number>(url, commessa);
  }

  deleteCommessa(idCommessaPadre: number) {
    const url = `${environment.attivitaApiRoot}/modulo-attivita-be/commesse/deleteCommessaPadre/id/${idCommessaPadre}`;
    return this.http.delete(url);
  }
  
}
