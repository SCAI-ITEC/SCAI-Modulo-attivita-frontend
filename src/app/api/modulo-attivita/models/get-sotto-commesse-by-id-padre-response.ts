/* tslint:disable */
/* eslint-disable */
import { ProjectManager } from './project-manager';
import { StatoCommessa } from './stato-commessa';
import { TipoAttivita } from './tipo-attivita';
import { TipoFatturazione } from './tipo-fatturazione';
export interface GetSottoCommesseByIdPadreResponse {
  codiceCommessa?: null | string;
  dataFine?: null | string;
  dataInizio?: null | string;
  dataInserimento?: null | string;
  decorrenzaAttivita?: null | string;
  descrizioneCommessa?: null | string;
  giorniPrevisti?: null | number;
  id?: number;
  idBusinessManager?: null | number;
  idCliente?: number;
  idClienteFinale?: null | number;
  idCommessaCollegata?: null | number;
  idCommessaFatturazione?: null | number;
  idCommessaPadre?: null | number;
  importo?: null | number;
  iniziativa?: null | string;
  percentualeAvanzamentoLavori?: null | number;
  projectManager?: ProjectManager;
  ribaltabileCliente?: boolean;
  statoCommessa?: StatoCommessa;
  stimaGiorniAFinire?: null | number;
  superamentoSoglia?: boolean;
  tag?: null | string;
  tipoAttivita?: TipoAttivita;
  tipoFatturazione?: TipoFatturazione;
  valido?: boolean;
}
