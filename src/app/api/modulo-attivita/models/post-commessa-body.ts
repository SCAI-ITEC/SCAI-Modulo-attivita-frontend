/* tslint:disable */
/* eslint-disable */
import { EnumTipiFatturazione } from './enum-tipi-fatturazione';
import { EnumTipoAttivita } from './enum-tipo-attivita';
export interface PostCommessaBody {
  codiceCommessa?: null | string;
  dataDecorrenza?: null | string;
  dataFine?: null | string;
  dataInizio?: null | string;
  descrizione?: null | string;
  id?: null | number;
  idAzienda?: null | number;
  idBusinessManager?: null | number;
  idCliente?: null | number;
  idClienteFinale?: null | number;
  idCommessaCollegata?: null | number;
  idCommessaFatturazione?: null | number;
  idCommessaPadre?: null | number;
  idProjectManager?: null | number;
  idSupportoController?: null | number;
  idTipoAttivita?: EnumTipoAttivita;
  idTipoFatturazione?: EnumTipiFatturazione;
  importo?: null | number;
  iniziativa?: null | string;
  ribaltabileCliente?: null | boolean;
  tag?: null | string;
  valido?: null | boolean;
}
