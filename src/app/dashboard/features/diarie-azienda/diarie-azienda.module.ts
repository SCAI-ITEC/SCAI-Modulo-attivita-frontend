import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from 'src/app/shared/shared.module';
import { RouterModule, Routes } from '@angular/router';
import { DiarieAziendaComponent } from './diarie-azienda.component';
import { CreazioneTipoTrasfertaComponent } from './creazione-tipo-trasferta/creazione-tipo-trasferta.component';
import { AbilitazioneDiariaAziendaComponent } from './abilitazione-diaria-azienda/abilitazione-diaria-azienda.component';
import { AbilitazioneDiariaCreazioneComponent } from './dialogs/abilitazione-diaria-creazione/abilitazione-diaria-creazione.component';
import { TipoTrasfertaCreazioneModificaComponent } from './dialogs/tipo-trasferta-creazione-modifica/tipo-trasferta-creazione-modifica.component';

const routes: Routes = [
  { path: 'creazione-tipo-trasferta', component: CreazioneTipoTrasfertaComponent },
  { path: 'abilitazione-diaria-azienda', component: AbilitazioneDiariaAziendaComponent }
];

@NgModule({
  declarations: [
    DiarieAziendaComponent,
    CreazioneTipoTrasfertaComponent,
    TipoTrasfertaCreazioneModificaComponent,
    AbilitazioneDiariaAziendaComponent,
    AbilitazioneDiariaCreazioneComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule
  ]
})
export class DiarieAziendaModule { }
