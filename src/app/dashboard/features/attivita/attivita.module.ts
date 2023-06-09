import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { AttivitaComponent } from './attivita.component';
import { EventoComponent } from './components/evento/evento.component';
import { OffertaComponent } from './components/offerta/offerta.component';
import { SottocommesseComponent } from './components/sottocommesse/sottocommesse.component';
import { TasksComponent } from './components/tasks/tasks.component';
import { RisorseComponent } from './components/risorse/risorse.component';
import { OrdiniComponent } from './components/ordini/ordini.component';
import { FattureComponent } from './components/fatture/fatture.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { EliminazioneDialog } from './dialogs/eliminazione.dialog';
import { AttivitaNavigationComponent } from './components/attivita-navigation/attivita-navigation.component';
import { CommessaCreazioneModifica } from './dialogs/commessa-creazione-modifica/commessa-creazione-modifica.component';
import { EventoCreazioneModifica } from './dialogs/evento-creazione-modifica/evento-creazione-modifica.component';
import { SottocommessaCreazioneModifica } from './dialogs/sottocommessa-creazione-modifica/sottocommessa-creazione-modifica.component';
import { TaskCreazioneModifica } from './dialogs/task-creazione-modifica/task-creazione-modifica.component';
import { RisorsaCreazioneModifica } from './dialogs/risorsa-creazione-modifica/risorsa-creazione-modifica.component';
import { ForzatureComponent } from './components/forzature/forzature.component';
import { ForzaturaCreazioneModifica } from './dialogs/forzatura-creazione-modifica/forzatura-creazione-modifica.component';
import { SottocommessaNavigationComponent } from './components/sottocommessa-navigation/sottocommessa-navigation.component';
import { ReperibilitaComponent } from './components/reperibilita/reperibilita.component';
import { StraordinarioComponent } from './components/straordinario/straordinario.component';
import { ReperibilitaCreazioneComponent } from './dialogs/reperibilita-creazione/reperibilita-creazione.component';
import { StraordinariCreazioneComponent } from './dialogs/straordinari-creazione/straordinari-creazione.component';


const routes: Routes = [
  { path: '', component: AttivitaComponent }
];

@NgModule({
  declarations: [
    AttivitaComponent,
    EventoComponent,
    OffertaComponent,
    SottocommesseComponent,
    TasksComponent,
    RisorseComponent,
    OrdiniComponent,
    FattureComponent,
    EliminazioneDialog,
    CommessaCreazioneModifica,
    AttivitaNavigationComponent,
    EventoCreazioneModifica,
    SottocommessaCreazioneModifica,
    TaskCreazioneModifica,
    RisorsaCreazioneModifica,
    ForzatureComponent,
    ForzaturaCreazioneModifica,
    SottocommessaNavigationComponent,
    ReperibilitaComponent,
    StraordinarioComponent,
    ReperibilitaCreazioneComponent,
    StraordinariCreazioneComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule
  ]
})
export class AttivitaModule { }
