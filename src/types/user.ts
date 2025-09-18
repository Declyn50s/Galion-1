export interface HouseholdMember {
  id: string;
  role: string;
  name: string;
  status: string;
  birthDate: string;
  gender: string;
  nationality: string;
  residencePermit: string;
  permitExpiryDate?: string;
    // 🔽 NOUVEAU
  unborn?: boolean;               // enfant à naître ?
  expectedBirthDate?: string;     // DPA (date prévue d’accouchement)
  // Curateur individuel
  hasCurator: boolean;
  curatorName?: string;
  curatorAddress?: string;
  curatorPhone?: string;
  curatorEmail?: string;
}

export interface UserProfile {
  // Statut
  isApplicant: boolean;
  isTenant: boolean;
  
  // Informations personnelles
  lastName: string;
  firstName: string;
  gender: string;
  birthDate: string;
  socialSecurityNumber: string;
  address: string;
  addressComplement: string;
  postalCode: string;
  city: string;
  phone: string;
  email: string;
  nationality: string;
  residencePermit: string;
  permitExpiryDate?: string;
  maritalStatus: string;
  
  // Ménage
  household: HouseholdMember[];
  
  // Dates importantes
  registrationDate: string;
  deadline: string;
  lastCertificateDate: string;
  
  // Revenus
  individualIncome: number;
  householdIncome: number;
  
  // Logement
  maxRooms?: number;
  minRent?: number;
  
  // Statut à Lausanne
  lausanneStatus?: string;
  lausanneStatusDate?: string;
  
  // Curateur
  hasCurator: boolean;
  curatorName?: string;
  curatorAddress?: string;
  curatorPhone?: string;
  curatorEmail?: string;
}

export const ROLE_OPTIONS = [
  'Conjoint',
  'Enfant à charge',
  'Enfant droit de visite',
  'Parent',
  'Autre'
];

export const STATUS_OPTIONS = [
  'Employé',
  'Élève',
  'Étudiant',
  'Droit de visite',
  'Chômeur',
  'Retraité',
  'Autre'
];

export const MARITAL_STATUS_OPTIONS = [
  'Célibataire',
  'Marié(e)',
  'Séparé(e)',
  'Divorcé(e)',
  'Veuf/Veuve',
  'Partenariat enregistré'
];
export const RESIDENCE_PERMIT_OPTIONS = [
  'Citoyen',
  'Permis C',
  'Permis B',
  'Permis F',
  'Permis S',
  'Permis L',
  'Permis G',
  'Sans permis'
];

export const LAUSANNE_STATUS_OPTIONS = [
  'Arrivé à Lausanne',
  'Rentré par le travail',
  'Conditions étudiantes'
];