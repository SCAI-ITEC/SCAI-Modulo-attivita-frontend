/* tslint:disable */
/* eslint-disable */
import { EnumTipiFatturazione } from './enum-tipi-fatturazione';
export interface PostSottoCommessaBody {
  codiceCommessa?: null | string;
  dataFine?: null | string;
  dataInizio?: null | string;
  descrizione?: null | string;
  idCommessaCollegata?: null | number;
  idCommessaFatturazione?: null | number;
  idCommessaPadre?: null | number;
  idProjectManager?: null | number;
  idSottoCommessa?: null | number;
  idTipoFatturazione?: EnumTipiFatturazione;
  importo?: null | number;
  iniziativa?: null | string;
  ribaltabileCliente?: null | boolean;
}
