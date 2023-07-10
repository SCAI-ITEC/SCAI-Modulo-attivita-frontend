/* tslint:disable */
/* eslint-disable */
import { Profile } from './profile';
import { User } from './user';
export interface TokenUserInfo {
  codiceLogin?: null | string;
  email?: null | string;
  idAzienda?: number;
  idSessione?: null | string;
  isAmministratore?: boolean;
  isBusinessManager?: boolean;
  isController?: boolean;
  isHRManager?: boolean;
  isProjectManager?: boolean;
  isResponsabileCommerciale?: boolean;
  isSegreteria?: boolean;
  isUtenteBase?: boolean;
  isUtenteBaseOnly?: boolean;
  master?: boolean;
  profili?: null | Array<Profile>;
  utente?: User;
}
