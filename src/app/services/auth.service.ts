import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from "rxjs";
import { environment } from 'src/environments/environment';
import { ENV_COLL, ENV_DEV, ENV_PROD } from 'src/environments/envs';
import { GetAttoreResponse } from '../api/modulo-attivita/models';
import { UtentiService } from '../api/modulo-attivita/services';
import { User, UTENTE_BASE } from '../models/user';
import { parseJwt } from '../utils/json';

const ANONYMOUS_USER: User = {
  idUtente: undefined,
  idAzienda: undefined,
  nome: undefined,
  cognome: undefined,
  roles: []
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private _user$ = new BehaviorSubject<User>(ANONYMOUS_USER);
  user$: Observable<User> = this._user$.asObservable();
  private set user(u: User) {
    this._user$.next(u);
  }
  get user() {
    return this._user$.getValue();
  }

  constructor(
    private utentiService: UtentiService
  ) {
    const segments = window.location.pathname.split("/");
    const isSplash = "splash" === segments.pop();
    if (!isSplash) this.autoLogin();
  }

  login(token: string, idAzienda: number, fakeUser?: User, fakeRoles: string[] = []) {

    localStorage.setItem('token', token);
    localStorage.setItem('id_azienda', JSON.stringify(idAzienda));
    localStorage.setItem("expires_at", JSON.stringify(parseJwt(token).exp));

    this.loggedInElseLogout();

    return this.utentiService
      .getAttore({ idAzienda })
      .pipe(
        tap((u: GetAttoreResponse) => {

          // Why can "u.utente" be undefined? Blame the backend!!!
          const { idUtente, cognome, nome } = u.utente as any;
          const roles = (u.profili || []).map(p => p.descrizione) as string[];

          this.user = {
            idAzienda,
            idUtente, 
            cognome,
            nome,
            roles: [ UTENTE_BASE, ...roles ]
          };

          if (fakeUser) {

            const { idUtente, cognome, nome } = fakeUser;

            this.user = {
              ...this.user,
              idUtente,
              cognome,
              nome,
              roles: [ UTENTE_BASE, ...fakeRoles ]
            };
          }

          localStorage.setItem('user_data', JSON.stringify(this.user));
        })
      );
  }

  autoLogin() {

    const token = localStorage.getItem('token');
    const idAzienda = localStorage.getItem('id_azienda');
    const userData = localStorage.getItem('user_data');

    this.loggedInElseLogout();
    
    if (token && idAzienda && userData)
      this.user = JSON.parse(userData);
    
    return this.user$;
  }

  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("id_azienda");
    localStorage.removeItem("user_data");
    localStorage.removeItem("expires_at");
    this.user = ANONYMOUS_USER;

    if ([ENV_COLL, ENV_PROD].includes(environment.name))
      window.location.href = environment.loginUrl;
  }

  loggedInElseLogout() {
    const loggedIn = this.isLoggedIn() || environment.name === ENV_DEV; // bypass this procedure in dev
    if (!loggedIn)
      this.logout();
  }

  isLoggedIn() {
    return new Date().getTime() < this.getExpiration();
  }

  isLoggedOut() {
    return !this.isLoggedIn();
  }

  getExpiration() {

    const expiration = localStorage.getItem("expires_at");

    let expiresAt = 0;
    if (expiration)
      expiresAt = JSON.parse(expiration) * 1000;

    return expiresAt;
  }
}
