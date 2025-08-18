export interface SearchResult {
  id: string;
  type: 'user' | 'dossier';
  name: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  nss?: string;
  dossierNumber?: string;
  matchField: string;
  matchText: string;
}

// Données de test pour la recherche
export const mockSearchData: SearchResult[] = [
  {
    id: '1',
    type: 'user',
    name: 'Sophie Martin',
    firstName: 'Sophie',
    lastName: 'Martin',
    birthDate: '1985-03-15',
    nss: '756.1234.5678.90',
    dossierNumber: 'D-2024-001',
    matchField: 'name',
    matchText: 'Sophie Martin'
  },
  {
    id: '2',
    type: 'user',
    name: 'Pierre Dubois',
    firstName: 'Pierre',
    lastName: 'Dubois',
    birthDate: '1978-11-22',
    nss: '756.9876.5432.10',
    dossierNumber: 'D-2024-002',
    matchField: 'name',
    matchText: 'Pierre Dubois'
  },
  {
    id: '3',
    type: 'user',
    name: 'Marie Leroy',
    firstName: 'Marie',
    lastName: 'Leroy',
    birthDate: '1992-07-08',
    nss: '756.5555.1111.22',
    dossierNumber: 'D-2024-003',
    matchField: 'name',
    matchText: 'Marie Leroy'
  },
  {
    id: '4',
    type: 'user',
    name: 'Jean Moreau',
    firstName: 'Jean',
    lastName: 'Moreau',
    birthDate: '1980-12-03',
    nss: '756.7777.3333.44',
    dossierNumber: 'D-2024-004',
    matchField: 'name',
    matchText: 'Jean Moreau'
  },
  {
    id: '5',
    type: 'user',
    name: 'Anna Schmidt',
    firstName: 'Anna',
    lastName: 'Schmidt',
    birthDate: '1995-05-17',
    nss: '756.2222.8888.55',
    dossierNumber: 'D-2024-005',
    matchField: 'name',
    matchText: 'Anna Schmidt'
  }
];