import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";
import { AuthService } from "src/app/services/auth.service";
import { CategoriaForzaturaDto, ForzaturaDto } from "../models/forzatura";
import { SimpleDto } from "../../commons/models/commessa";

@Injectable({
    providedIn: 'root'
})
export class ForzaturaService {

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) {}

    getForzature$(idCommessaPadre: number, categoria: "costo" | "ricavo"){
        const url = `${environment.scaiRoot}/modulo-attivita-be/forzature/${categoria}/${idCommessaPadre}`;
        return this.http.get<ForzaturaDto[]>(url);
    }

    getForzaturaById$(idForzatura: number, categoria: "costo" | "ricavo") {
        const url = `${environment.scaiRoot}/modulo-attivita-be/forzature/id/${categoria}/${idForzatura}`;
        return this.http.get<ForzaturaDto>(url);
    }

    getCategorieForzature$() {
        const url = `${environment.scaiRoot}/modulo-attivita-be/forzature/categorie`;
        return this.http.get<CategoriaForzaturaDto[]>(url);
    }

    getClassificazioneDiCosto$() {
        const url = `${environment.scaiRoot}/modulo-attivita-be/forzature/classificazione-mini-list`;
        return this.http.get<SimpleDto[]>(url);
    }

    createForzatura$(input: ForzaturaDto) {
        input.idAzienda = this.authService.user.idAzienda;
        input.valido = 1;
        const idUtente = this.authService.user.idUtente;
        const url = `${environment.scaiRoot}/modulo-attivita-be/forzature/save/id-utente/${idUtente}`;
        return this.http.post<number>(url, input);
    }

    updateForzatura$(idForzatura: number, input: ForzaturaDto) {
        input.idAzienda = this.authService.user.idAzienda;
        input.valido = 1;
        const idUtente = this.authService.user.idUtente;
        const url = `${environment.scaiRoot}/modulo-attivita-be/forzature/update/id/${idForzatura}/id-utente/${idUtente}`;
        return this.http.put<string>(url, input);
    }

    deleteForzatura$(idForzatura: number, categoria: "costo" | "ricavo") {
        const idUtente = this.authService.user.idUtente;
        const url = `${environment.scaiRoot}/modulo-attivita-be/forzature/delete/${categoria}/id/${idForzatura}/id-utente/${idUtente}`;
        return this.http.delete<ForzaturaDto>(url);
    }

}