export interface License {
  ID: number;
  IDClient: string;
  IdentifiantPC: string | null;
  Options: string | null;
  Serial: string | null;
  Suspendu: number;
  NomSoft: string | null;
  NomPoste: string | null;
  NomSession: string | null;
  Date_DerUtilisation: string | null;
  Version: string | null;
  Data1: string | null;
  Data2: string | null;
  FTP1_Hote: string | null;
  FTP2_Hote: string | null;
  FTP1_Identifiant: string | null;
  FTP2_Identifiant: string | null;
  FTP1_Mdp: string | null;
  FTP2_Mdp: string | null;
  Data_Actif: number | null;
  FTP_Actif: number | null;
  URL1: string | null;
  URL2: string | null;
  IDSynchro: string | null;
  NbRun: number | null;
  Date_LimiteUtil: string | null;
  Terminaux: string | null;
  Tablettes: string | null;
  MrqBlancheNum: number | null;
  Upload1: string | null;
  Upload2: string | null;
  Secu2Srv1: string | null;
  Info: string | null;
  ConfigConnecteur: string | null;
  Premium: number;
  MDP_Premium: string | null;
  Autorisations_Premium: string | null;
  ConfigMobile: string | null;
  DateClient: string | null;
  Partenaire: number | null;
}

export interface LicenseFilters {
  idClient?: string;
  idSynchro?: string;
  serial?: string;
  identifiantPC?: string;
  onlyNuxiDev?: boolean;
}

export interface StudioLicenseFilters {
  numClient?: string;
  serial?: string;
  identifiantUser?: string;
  onlyWithPDF?: boolean;
  onlyWithVue?: boolean;
  onlyWithPagePerso?: boolean;
  onlyWithWDE?: boolean;
  hideSuspended?: boolean;
}

export interface ApiKeyLicenseFilters {
  clientId?: string;
  apiKey?: string;
  serial?: string;
  onlyExpired?: boolean; // Pour filtrer uniquement les licences épuisées (Qté <= 0)
  showInactive?: boolean;
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface StudioLicense {
  ID: number;
  NumClient: number;
  Serial: string | null;
  IdentifiantUser: string | null;
  PDF: number;
  Vue: number;
  PagePerso: number;
  WDE: number;
  Suspendu: number;
}

export interface ApiKeyLicense {
  ID: number;
  ClientID: number;
  Serial: string;
  ApiKey: string;
  ApiKeyV5: string;
  Quantity: number;
  LastUsed: string;
  Restriction: string;
}

export interface NuxiSavLicense {
  ID: number;
  IdClient: number;
  IdentifiantWeb: string | null;
  SerialPermanente: string | null;
  NbrPermanente: number;
  Options: string | null;
  Version: string | null;
  Suspendu: number | null;
  Postes: NuxiSavPoste[];
}

export interface NuxiSavPoste {
  ID: number;
  IDLicence: number;
  Serial: string | null;
  Emprunte_PC: string | null;
  Nom_Poste: string | null;
  Nom_Session: string | null;
  Der_Utilisation: string | null;
  Version: string | null;
  Connecte: number | null;
}

export interface NuxiSavLicenseFilters {
  idClient?: string;
  identifiantWeb?: string;
  serial?: string;
  onlyWithAtel?: boolean;
  onlyWithTrck?: boolean;
  onlyWithTckWeb?: boolean;
  onlyWithAud?: boolean;
  onlyWithSdk?: boolean;
  hideSuspended?: boolean;
}
