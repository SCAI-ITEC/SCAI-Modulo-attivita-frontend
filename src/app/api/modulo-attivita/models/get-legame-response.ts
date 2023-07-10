/* tslint:disable */
/* eslint-disable */
import { Diaria } from './diaria';
import { Utente } from './utente';
export interface GetLegameResponse {
  diaria?: Diaria;
  fine?: null | string;
  id?: number;
  idAzienda?: null | number;
  idTask?: number;
  inizio?: null | string;
  utente?: Utente;
}
