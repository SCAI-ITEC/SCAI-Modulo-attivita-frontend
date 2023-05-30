import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { combineLatest, tap } from 'rxjs';
import { ROLES } from 'src/app/models/user';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  loginForm = new FormGroup({
    token: new FormControl(null, [ Validators.required ]),
    idAzienda: new FormControl("15", [ Validators.required ])
  });

  impersonateForm = new FormGroup({
    token: new FormControl(null, [ Validators.required ]),
    idAzienda: new FormControl("15", [ Validators.required ]),
    utente: new FormControl(null, [ Validators.required ]),
    roles: new FormControl()
  });

  aziende: { text: string, value: string }[] = [];

  idAziendaUtenti: { [key: string]: { idUtente: number, nome: string, cognome: string }[] } = {};
  utenti: { idUtente: number, nome: string, cognome: string }[] = [];
  utentiFormatter = (user: any) => user.cognome + ' ' + user.nome;

  roles = Object.values(ROLES).map(role => ({ text: role, name: role }));
  rolesFormatter = (role: any) => role.name?.split('-').pop().trim();

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) { }

  ngOnInit() {

    this.impersonateForm.controls.idAzienda
      .valueChanges
      .pipe(
        tap(idAzienda => {

          if (idAzienda === null || idAzienda === undefined) return;

          this.impersonateForm.controls.utente.setValue(null);

          if (this.idAziendaUtenti[idAzienda])
            this.utenti = this.idAziendaUtenti[idAzienda];
        })
      )
      .subscribe();

    combineLatest([
      this.http.get('assets/json/id-azienda-azienda.json'),
      this.http.get('assets/json/users.json')
    ])
    .subscribe(([ idAziendaAzienda, idAziendaUtenti ]) => {

      // Set aziende
      Object.entries(idAziendaAzienda)
        .forEach(([ idAzienda, azienda ]) =>
          this.aziende.push({
            value: idAzienda,
            text: azienda.descrizione
          })
        );

      // Set utenti
      this.idAziendaUtenti = idAziendaUtenti as any;

      // Set idAzienda
      this.impersonateForm.controls.idAzienda.setValue("15");
    });
  }

  login() {

    const val = this.loginForm.value;

    if (!val.token || !val.idAzienda)
      return;

    this.authService
      .login(
        val.token,
        parseInt(val.idAzienda)
      )
      .subscribe(() => {
        this.router.navigateByUrl('/');
      });
  }

  impersonateLogin() {

    const val = this.impersonateForm.value;

    if (!val.token || !val.utente || !val.idAzienda)
      return;

    const fakeRoles = (val.roles || []).map((role: any) => role.name);

    this.authService
      .login(
        val.token,
        parseInt(val.idAzienda),
        val.utente,
        fakeRoles
      )
      .subscribe(() => {
        this.router.navigateByUrl('/');
      });
  }

  isValidToken(token: string) {
    try {
      const sections = token.split(".");
      JSON.parse(atob(sections[1]));
      return sections.every(section => /^[\w-]+$/.test(section));
    }
    catch(e) {
      return false;
    }
  }

}
