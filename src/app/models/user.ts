export const SEGRETERIA = "Modulo Attivita - Segreteria";
export const RESPONSABILE_COMMERCIALE = "Modulo Attivita - Responsabile Commerciale";
export const PROJECT_MANAGER = "Modulo Attivita - Project Manager";
export const HR_MANAGER = "Modulo Attivita - HR Manager";
export const CONTROLLER = "Modulo Attivita - Controller";
export const BUSINESS_MANAGER = "Modulo Attivita - Business Manager";
export const AUTOASSEGNAZIONE = "Modulo Attivita - Autoassegnazione";
export const AMMINISTRATORE = "Modulo Attivita - Amministratore ";
export const UTENTE_BASE = "Modulo Attivita - Utente Base";

export const ROLES = {
    SEGRETERIA: SEGRETERIA,
    RESPONSABILE_COMMERCIALE: RESPONSABILE_COMMERCIALE,
    PROJECT_MANAGER: PROJECT_MANAGER,
    HR_MANAGER: HR_MANAGER,
    CONTROLLER: CONTROLLER,
    BUSINESS_MANAGER: BUSINESS_MANAGER,
    AUTOASSEGNAZIONE: AUTOASSEGNAZIONE,
    AMMINISTRATORE: AMMINISTRATORE,
    UTENTE_BASE: UTENTE_BASE
};

export interface User {
    idUtente?: number;
    idAzienda?: number;
    nome?: string;
    cognome?: string;
    roles: string[];
}