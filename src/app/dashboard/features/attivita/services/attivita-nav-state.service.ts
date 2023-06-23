import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, filter } from "rxjs";
import { AuthService } from "src/app/services/auth.service";
import { ROLES } from "src/app/models/user";
import { GetCommessaResponse } from "src/app/api/modulo-attivita/models";

@Injectable()
export class AttivitaNavStateService {

    userPmRole: string = "";
    userBmRole: string = "";

    constructor(
        private authService: AuthService
    ) { }

    private _commessa$ = new BehaviorSubject<GetCommessaResponse | null>(null);
    commessa$ = this._commessa$.asObservable()
        .pipe(filter(x => !!x)) as Observable<GetCommessaResponse>;

    set commessa(comm: GetCommessaResponse | null) {

        this._commessa$.next(comm);
        
        if (comm && comm?.businessManager) {
            if (this.authService.user.idUtente === comm.businessManager.id) {
                this.userBmRole = ROLES.BUSINESS_MANAGER;
            }
        }
    }

    get commessa(): GetCommessaResponse | null {
        return this._commessa$.getValue();
    }

    private _sottocommessa$ = new BehaviorSubject<GetCommessaResponse | null>(null);
    sottocommessa$ = this._sottocommessa$.asObservable()
        .pipe(filter(x => !!x)) as Observable<GetCommessaResponse>;

    set sottocommessa(sottocomm: GetCommessaResponse | null) {
        if (sottocomm && sottocomm?.businessManager) {
            if (this.authService.user.idUtente === sottocomm.businessManager.id) {
                this.userPmRole = ROLES.PROJECT_MANAGER;
            }
        }
    }

    get sottocommessa(): GetCommessaResponse | null {
        return this._sottocommessa$.getValue();
    }

}