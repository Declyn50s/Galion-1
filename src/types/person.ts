export type PersonListItem = {
id: string;
genre: string;
nom: string;
prenom: string;
dateNaissance: string; // format actuel: "DD.MM.YYYY"
adresse: string;
complement?: string;
npa: string;
ville: string;
llm: boolean;
statut: 'Actif' | 'Inactif' | 'À vérifier' | 'Refusé' | string;
};