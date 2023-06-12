/* tslint:disable */
/* eslint-disable */
import { Diaria } from './diaria';
import { Utente } from './utente';
export interface Legame {
  diaria?: Diaria;
  fine?: null | string;
  id?: number;
  idAzienda?: null | number;
  idTask?: number;
  inizio?: null | string;
  utente?: Utente;
}
