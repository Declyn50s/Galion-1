import React, { useEffect, useMemo, useState, useTransition } from 'react';
import { parseISO, format } from 'date-fns';
import { LogIn, ChevronDown, ChevronRight } from 'lucide-react';
import NewEntryModal, { mockSearchUserByNSS, mockSearchMotifs, mockSaveEntry } from '@/components/NewEntryModal';

/**
 * Journal — interface desktop-first (React + Tailwind)
 * - Bouton "Entrée" centré
 * - Bandeau de filtres (live) 7 colonnes
 * - Recherche globale avec debounce 300ms + skeleton si >200ms
 * - Tableau desktop + cartes mobile
 * - Détails (disclosure row) listant tous les utilisateurs triés par âge croissant
 * - Statuts (badges), Priorité (points), LLM (point vert foncé)
 * - Données fictives incluses
 */

// -----------------------------
// Types
// -----------------------------
export type Utilisateur = {
  titre: 'M.' | 'Mme' | 'Mx.' | string;
  nom: string;
  prenom: string;
  dateNaissance: string; // ISO
  adresse: string;
  npa: string;
  ville: string;
  nbPers: number;
  nbEnf: number;
};

export type Tache = {
  id: string;
  dossier: string; // N° de dossier
  nss: string;
  reception: string; // ISO
  motif: 'Inscription' | 'Renouvellement' | 'Mise à jour' | 'Contrôle' | 'Résiliation' | 'Préfecture' | 'Gérance';
  voie: 'Guichet' | 'Courrier' | 'Email' | 'Jaxform' | 'Collaborateur';
  par: string; // nom de l'agent (on dérive les 3 lettres)
  observation: string;
  statut: 'À traiter' | 'En traitement' | 'En suspens' | 'Validé' | 'Refusé';
  priorite: 'Haute' | 'Moyenne' | 'Basse';
  llm: boolean;
  utilisateurs: Utilisateur[];
};

// -----------------------------
// Données fictives (au moins 3 tâches)
// -----------------------------
const DATA: Tache[] = [
  {
    id: 'T-2025-0001',
    dossier: 'DOS-87412',
    nss: '756.1234.5678.97',
    reception: '2025-06-03',
    motif: 'Inscription',
    voie: 'Guichet',
    par: 'Alice Bernard',
    observation: 'Demande prioritaire, situation précaire.',
    statut: 'À traiter',
    priorite: 'Haute',
    llm: true,
    utilisateurs: [
      { titre: 'Mme', nom: 'Durand', prenom: 'Claire', dateNaissance: '1994-09-12', adresse: 'Rue des Lilas 12', npa: '1000', ville: 'Lausanne', nbPers: 2, nbEnf: 1 },
      { titre: 'M.', nom: 'Durand', prenom: 'Paul', dateNaissance: '1990-01-03', adresse: 'Rue des Lilas 12', npa: '1000', ville: 'Lausanne', nbPers: 2, nbEnf: 1 },
    ],
  },
  {
    id: 'T-2025-0015',
    dossier: 'DOS-91022',
    nss: '756.9999.0000.18',
    reception: '2025-07-18',
    motif: 'Mise à jour',
    voie: 'Email',
    par: 'Bruno Cattin',
    observation: 'Pièces justificatives manquantes (revenus).',
    statut: 'En traitement',
    priorite: 'Moyenne',
    llm: false,
    utilisateurs: [
      { titre: 'M.', nom: 'Martin', prenom: 'Jean', dateNaissance: '1988-05-22', adresse: 'Av. du Rhône 24', npa: '1200', ville: 'Genève', nbPers: 1, nbEnf: 0 },
    ],
  },
  {
    id: 'T-2025-0032',
    dossier: 'DOS-99310',
    nss: '756.1111.2222.33',
    reception: '2025-05-09',
    motif: 'Contrôle',
    voie: 'Courrier',
    par: 'Chloé Dupuis',
    observation: 'Adresse à vérifier, retour postal.',
    statut: 'En suspens',
    priorite: 'Basse',
    llm: true,
    utilisateurs: [
      { titre: 'Mx.', nom: 'Leroy', prenom: 'Alex', dateNaissance: '2001-11-02', adresse: 'Chemin Vert 5', npa: '1020', ville: 'Renens', nbPers: 3, nbEnf: 2 },
      { titre: 'M.', nom: 'Leroy', prenom: 'Marc', dateNaissance: '1979-03-14', adresse: 'Chemin Vert 5', npa: '1020', ville: 'Renens', nbPers: 3, nbEnf: 2 },
      { titre: 'Mme', nom: 'Leroy', prenom: 'Nina', dateNaissance: '1982-08-30', adresse: 'Chemin Vert 5', npa: '1020', ville: 'Renens', nbPers: 3, nbEnf: 2 },
    ],
  },
  {
    id: 'T-2025-0040',
    dossier: 'DOS-10001',
    nss: '756.5555.4444.22',
    reception: '2025-08-05',
    motif: 'Renouvellement',
    voie: 'Jaxform',
    par: 'Alice Bernard',
    observation: 'Dossier complet, prêt pour validation.',
    statut: 'Validé',
    priorite: 'Moyenne',
    llm: true,
    utilisateurs: [
      { titre: 'M.', nom: 'Nguyen', prenom: 'Bao', dateNaissance: '1999-12-01', adresse: 'Rue du Lac 2', npa: '1007', ville: 'Lausanne', nbPers: 1, nbEnf: 0 },
    ],
  },
];

// -----------------------------
// Helpers
// -----------------------------
const fmt = (iso: string) => format(parseISO(iso), 'dd.MM.yyyy');

const initials3 = (fullName: string) => {
  const s = fullName.normalize('NFD').replace(/[^\p{L}]+/gu, '');
  return s.slice(0, 3).toUpperCase();
};

const statutBadge = (s: Tache['statut']) => {
  const base = 'px-2 py-0.5 rounded text-xs font-medium';
  switch (s) {
    case 'À traiter':
      return `${base} bg-yellow-600 text-white`;
    case 'En traitement':
      return `${base} bg-blue-600 text-white`;
    case 'En suspens':
      return `${base} bg-gray-600 text-white`;
    case 'Validé':
      return `${base} bg-green-700 text-white`;
    case 'Refusé':
      return `${base} bg-red-700 text-white`;
  }
};

const priorityDot = (p: Tache['priorite']) => {
  switch (p) {
    case 'Haute':
      return 'bg-red-600';
    case 'Moyenne':
      return 'bg-orange-500';
    case 'Basse':
      return 'bg-green-600';
  }
};

const containsCI = (text: string, q: string) => text.toLowerCase().includes(q.toLowerCase());

const age = (isoBirth: string) => {
  const d = parseISO(isoBirth);
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return a;
};

// -----------------------------
// Composant
// -----------------------------
export default function Journal() {
  // Filtres
  const [filtreReception, setFiltreReception] = useState<string>(''); // ISO or '' = tous
  const [filtreMotif, setFiltreMotif] = useState<string>('Tous');
  const [filtreVoie, setFiltreVoie] = useState<string>('Tous');
  const [filtrePar, setFiltrePar] = useState<string>('Tous'); // 3 lettres
  const [filtreStatut, setFiltreStatut] = useState<string>('Tous');
  const [filtrePriorite, setFiltrePriorite] = useState<string>('Toutes');

  // Recherche globale (debounced)
  const [searchRaw, setSearchRaw] = useState('');
  const [search, setSearch] = useState('');
  const [isPending, startTransition] = useTransition();
  const [showSkeleton, setShowSkeleton] = useState(false);

  // Détails ouverts + modale
  const [openRows, setOpenRows] = useState<Record<string, boolean>>({});
  const [openNew, setOpenNew] = useState(false);

  // Debounce 300ms
  useEffect(() => {
    const t = setTimeout(() => {
      const start = performance.now();
      startTransition(() => {
        setSearch(searchRaw);
      });
      const timer = setTimeout(() => setShowSkeleton(true), 200);
      Promise.resolve().then(() => {
        const elapsed = performance.now() - start;
        if (elapsed < 200) {
          clearTimeout(timer);
          setShowSkeleton(false);
        }
      });
    }, 300);
    return () => clearTimeout(t);
  }, [searchRaw, startTransition]);

  // Options dynamiques
  const optionsReception = useMemo(() => {
    const set = new Set(DATA.map(d => d.reception));
    return Array.from(set).sort((a, b) => (a < b ? -1 : 1)); // plus ancien -> récent
  }, []);

  const optionsPar = useMemo(() => {
    const set = new Set(DATA.map(d => initials3(d.par)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, []);

  // Filtrage + recherche
  const results = useMemo(() => {
    const q = search.trim();
    const res = DATA.filter((t) => {
      // Filtres
      if (filtreReception && t.reception !== filtreReception) return false;
      if (filtreMotif !== 'Tous' && t.motif !== filtreMotif) return false;
      if (filtreVoie !== 'Tous' && t.voie !== filtreVoie) return false;
      if (filtrePar !== 'Tous' && initials3(t.par) !== filtrePar) return false;
      if (filtreStatut !== 'Tous' && t.statut !== filtreStatut) return false;
      if (filtrePriorite !== 'Toutes' && t.priorite !== filtrePriorite) return false;

      if (!q) return true;

      // Recherche globale (ID, Nom, Prénom, NSS, N° dossier, Date de naissance, Observation)
      const hay = [
        t.id,
        t.dossier,
        t.nss,
        t.observation,
        ...t.utilisateurs.map(u => `${u.nom} ${u.prenom} ${fmt(u.dateNaissance)}`),
      ].join(' ').toLowerCase();
      return hay.includes(q.toLowerCase());
    });
    return res;
  }, [search, filtreReception, filtreMotif, filtreVoie, filtrePar, filtreStatut, filtrePriorite]);

  const toggleRow = (id: string) => setOpenRows(prev => ({ ...prev, [id]: !prev[id] }));
  const isRowOpen = (id: string) => !!openRows[id];

  // Actions selon statut
  const actionsFor = (s: Tache['statut']) => {
    if (s === 'Validé') return ['Reprendre', 'Consulter'];
    if (s === 'En traitement') return ['Consulter'];
    return ['Traiter', 'Transférer'];
  };

  // UI util
  const FilterWrap: React.FC<{ label: string; active: boolean; onClear?: () => void; children: React.ReactNode }>
    = ({ label, active, onClear, children }) => (
      <div className="relative">
        <label className="mb-1 block text-xs text-slate-600">{label}</label>
        {children}
        {active && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2 top-[34px] -translate-y-1/2 text-slate-400 hover:text-slate-700"
            aria-label={`Effacer filtre ${label}`}
          >
            ×
          </button>
        )}
      </div>
    );

  return (
    <div className="max-w-[1280px] mx-auto p-4">
      {/* 1) Bouton Entrée centré */}
      <div className="flex justify-center mb-3">
        <button
          className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-white shadow hover:scale-[1.01] transition focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          aria-label="Créer une nouvelle entrée"
          onClick={() => setOpenNew(true)}
        >
          <LogIn className="h-4 w-4" /> Entrée
        </button>
      </div>

      {/* 2) Bandeau de filtres */}
      <div className="grid grid-cols-1 sm:grid-cols-7 gap-3 bg-gray-50 shadow-inner p-2 rounded-md mb-4">
        <FilterWrap label="Réception" active={!!filtreReception} onClear={() => setFiltreReception('')}>
          <select
            className="w-full rounded border border-slate-300 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            value={filtreReception}
            onChange={(e) => setFiltreReception(e.target.value)}
          >
            <option value="">Toutes</option>
            {optionsReception.map((iso) => (
              <option key={iso} value={iso}>{fmt(iso)}</option>
            ))}
          </select>
        </FilterWrap>

        <FilterWrap label="Motif" active={filtreMotif !== 'Tous'} onClear={() => setFiltreMotif('Tous')}>
          <select className="w-full rounded border border-slate-300 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" value={filtreMotif} onChange={(e) => setFiltreMotif(e.target.value)}>
            {['Tous', 'Inscription', 'Renouvellement', 'Mise à jour', 'Contrôle', 'Résiliation', 'Préfecture', 'Gérance'].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </FilterWrap>

        <FilterWrap label="Voie" active={filtreVoie !== 'Tous'} onClear={() => setFiltreVoie('Tous')}>
          <select className="w-full rounded border border-slate-300 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" value={filtreVoie} onChange={(e) => setFiltreVoie(e.target.value)}>
            {['Tous', 'Guichet', 'Courrier', 'Email', 'Jaxform', 'Collaborateur'].map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </FilterWrap>

        <FilterWrap label="Par" active={filtrePar !== 'Tous'} onClear={() => setFiltrePar('Tous')}>
          <select className="w-full rounded border border-slate-300 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" value={filtrePar} onChange={(e) => setFiltrePar(e.target.value)}>
            <option value="Tous">Tous</option>
            {optionsPar.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </FilterWrap>

        <FilterWrap label="Statut" active={filtreStatut !== 'Tous'} onClear={() => setFiltreStatut('Tous')}>
          <select className="w-full rounded border border-slate-300 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)}>
            {['Tous', 'À traiter', 'En traitement', 'En suspens', 'Validé', 'Refusé'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </FilterWrap>

        <FilterWrap label="Priorité" active={filtrePriorite !== 'Toutes'} onClear={() => setFiltrePriorite('Toutes')}>
          <select className="w-full rounded border border-slate-300 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" value={filtrePriorite} onChange={(e) => setFiltrePriorite(e.target.value)}>
            {['Toutes', 'Haute', 'Moyenne', 'Basse'].map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </FilterWrap>

        {/* 3) Barre de recherche globale */}
        <div className="sm:col-span-7">
          <label className="mb-1 block text-xs text-slate-600">Recherche</label>
          <input
            type="text"
            value={searchRaw}
            onChange={(e) => setSearchRaw(e.target.value)}
            placeholder="Rechercher (ID, Nom, Prénom, NSS, N° de dossier, Date de naissance, Observation)"
            className="w-full rounded border border-slate-300 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            aria-label="Recherche globale"
          />
          <div className="mt-1 text-xs text-slate-600">{results.length} résultat{results.length > 1 ? 's' : ''}</div>
        </div>
      </div>

      {/* Loader si calcul long */}
      {(isPending && showSkeleton) && (
        <div className="animate-pulse space-y-2 mb-3">
          <div className="h-4 w-1/3 bg-slate-200 rounded" />
          <div className="h-24 w-full bg-slate-200 rounded" />
        </div>
      )}

      {/* 4) Desktop table */}
      <div className="hidden md:block">
        <table className="w-full text-sm border-collapse">
          <thead className="text-left text-slate-600">
            <tr>
              <th className="py-2">ID</th>
              <th className="py-2">Réception</th>
              <th className="py-2">Motif</th>
              <th className="py-2">Voie</th>
              <th className="py-2">Par</th>
              <th className="py-2">Statut</th>
              <th className="py-2">Observation</th>
              <th className="py-2">Priorité</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {results.map((t) => (
              <React.Fragment key={t.id}>
                <tr
                  className="hover:bg-slate-50 cursor-pointer focus-within:bg-slate-50"
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleRow(t.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleRow(t.id); } }}
                >
                  <td className="py-2 align-top">
                    <div className="flex items-center gap-2">
                      {isRowOpen(t.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <span className="underline">{t.id}</span>
                      {t.llm && <span className="ml-1 inline-block h-3 w-3 rounded-full bg-green-800" aria-label="LLM actif" />}
                    </div>
                  </td>
                  <td className="py-2 align-top">{fmt(t.reception)}</td>
                  <td className="py-2 align-top">{t.motif}</td>
                  <td className="py-2 align-top">{t.voie}</td>
                  <td className="py-2 align-top">{initials3(t.par)}</td>
                  <td className="py-2 align-top"><span className={statutBadge(t.statut)}>{t.statut}</span></td>
                  <td className="py-2 align-top max-w-[24ch] truncate" title={t.observation}>{t.observation}</td>
                  <td className="py-2 align-top">
                    <span className={`inline-block h-3 w-3 rounded-full ${priorityDot(t.priorite)}`} aria-label={`Priorité ${t.priorite}`} />
                  </td>
                  <td className="py-2 align-top">
                    <div className="flex gap-3">
                      {actionsFor(t.statut).map(a => (
                        <span key={a} className="underline text-slate-800 hover:text-slate-900" onClick={(e) => { e.stopPropagation(); console.log(a, t.id); }}>{a}</span>
                      ))}
                    </div>
                  </td>
                </tr>
                {/* 5) Détails utilisateur */}
                {isRowOpen(t.id) && (
                  <tr className="bg-slate-50">
                    <td colSpan={9} className="p-3">
                      <ul className="italic text-sm space-y-1">
                        {[...t.utilisateurs]
                          .sort((u1, u2) => age(u1.dateNaissance) - age(u2.dateNaissance))
                          .map((u, idx) => (
                            <li key={idx}>
                              {`${u.titre} ${u.nom.toUpperCase()} ${u.prenom}, né(e) le ${fmt(u.dateNaissance)}, ${u.adresse}, ${u.npa} ${u.ville}, ${u.nbPers} pers., ${u.nbEnf} enf.`}
                            </li>
                          ))}
                      </ul>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* 4) Mobile cards */}
      <div className="md:hidden space-y-3">
        {results.map((t) => (
          <div key={t.id} className="rounded border border-slate-200 shadow-sm p-3">
            <button
              className="w-full flex items-center justify-between text-left"
              onClick={() => toggleRow(t.id)}
              aria-expanded={isRowOpen(t.id)}
            >
              <div className="font-medium">{t.id}</div>
              {isRowOpen(t.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            <div className="mt-2 text-sm grid grid-cols-2 gap-y-1">
              <div className="text-slate-500">Réception</div><div>{fmt(t.reception)}</div>
              <div className="text-slate-500">Motif</div><div>{t.motif}</div>
              <div className="text-slate-500">Voie</div><div>{t.voie}</div>
              <div className="text-slate-500">Par</div><div>{initials3(t.par)}</div>
              <div className="text-slate-500">Statut</div><div><span className={statutBadge(t.statut)}>{t.statut}</span></div>
              <div className="text-slate-500">Observation</div><div className="col-span-1">{t.observation}</div>
              <div className="text-slate-500">Priorité</div><div><span className={`inline-block h-3 w-3 rounded-full ${priorityDot(t.priorite)}`} /></div>
            </div>
            <div className="mt-2 flex gap-3 text-sm">
              {actionsFor(t.statut).map(a => (
                <span key={a} className="underline" onClick={() => console.log(a, t.id)}>{a}</span>
              ))}
            </div>
            {isRowOpen(t.id) && (
              <div className="mt-3 bg-slate-50 p-2 rounded">
                <ul className="italic text-sm space-y-1">
                  {[...t.utilisateurs]
                    .sort((u1, u2) => age(u1.dateNaissance) - age(u2.dateNaissance))
                    .map((u, idx) => (
                      <li key={idx}>
                        {`${u.titre} ${u.nom.toUpperCase()} ${u.prenom}, né(e) le ${fmt(u.dateNaissance)}, ${u.adresse}, ${u.npa} ${u.ville}, ${u.nbPers} pers., ${u.nbEnf} enf.`}
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modale Nouvelle entrée */}
      <NewEntryModal
        open={openNew}
        onOpenChange={setOpenNew}
        searchUserByNSS={mockSearchUserByNSS}
        searchMotifs={mockSearchMotifs}
        saveEntry={mockSaveEntry}
      />
    </div>
  );
}
