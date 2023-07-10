/* tslint:disable */
/* eslint-disable */
import { BusinessManager } from './business-manager';
import { Cliente } from './cliente';
import { ClienteFinale } from './cliente-finale';
import { ProjectManager } from './project-manager';
import { StatoCommessa } from './stato-commessa';
import { SupportoController } from './supporto-controller';
import { TipoAttivita } from './tipo-attivita';
import { TipoFatturazione } from './tipo-fatturazione';
export interface GetCommessaResponse {
  businessManager?: BusinessManager;
  cliente?: Cliente;
  clienteFinale?: ClienteFinale;
  codiceCommessa?: null | string;
  dataDecorrenza?: null | string;
  dataFine?: null | string;
  dataInizio?: null | string;
  dataInserimento?: null | string;
  descrizione?: null | string;
  giorniPrevisti?: null | number;
  id?: number;
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
  supportoController?: SupportoController;
  tag?: null | string;
  tipoAttivita?: TipoAttivita;
  tipoFatturazione?: TipoFatturazione;
  valido?: boolean;
}
