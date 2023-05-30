import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, filter } from "rxjs";
import { AuthService } from "src/app/services/auth.service";
import { ROLES } from "src/app/models/user";
import { CommessaDto } from "../../commons/models/commessa";

@Injectable()
export class AttivitaNavStateService {

    userPmRole: string = "";
    userBmRole: string = "";

    constructor(
        private authService: AuthService
    ) { }

    private _commessa$ = new BehaviorSubject<CommessaDto | null>(null);
    commessa$ = this._commessa$
        .asObservable()
        .pipe(
            filter(commessa => !!commessa) // Only emit when it has a value
        ) as Observable<CommessaDto>;

    set commessa(value: CommessaDto | null) {

        this._commessa$.next(value);
        
        if (value) {

            const isUserPm = this.authService.user.idUtente === value.idProjectManager;
            if (isUserPm) this.userPmRole = ROLES.PROJECT_MANAGER;

            const isUserBm = this.authService.user.idUtente === value.idBusinessManager
            if (isUserBm) this.userBmRole = ROLES.BUSINESS_MANAGER;
        }
    }
    get commessa(): CommessaDto | null {
        return this._commessa$.getValue();
    }

}