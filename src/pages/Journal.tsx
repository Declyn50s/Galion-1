// src/pages/pages/Journal.tsx
import React, { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { parseISO, format } from 'date-fns';
import { LogIn, ChevronDown, ChevronRight, Search, ArrowUpDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import NewEntryModal, { mockSearchUserByNSS, mockSaveEntry } from '@/components/NewEntryModal';

/**
 * Ajouts :
 * - Publication immédiate depuis NewEntryModal via onSaved
 * - Priorité: on garde l’affichage existant; "Normal" est mappé à "Moyenne" côté modal
 */

// -----------------------------
// Types
// -----------------------------
export type Utilisateur = {
  titre: 'M.' | 'Mme' | string;
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
  priorite: 'Haute' | 'Basse';
  llm: boolean;
  utilisateurs: Utilisateur[];
};

// -----------------------------
// Données fictives (initiales)
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
    observation: 'Demande prioritaire',
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
    par: 'Derval Botuna',
    observation: '',
    statut: 'En traitement',
    priorite: 'Basse',
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
    observation: 'à envoyer par mail',
    statut: 'En suspens',
    priorite: 'Basse',
    llm: true,
    utilisateurs: [
      { titre: 'M.', nom: 'Leroy', prenom: 'Alex', dateNaissance: '2001-11-02', adresse: 'Chemin Vert 5', npa: '1020', ville: 'Renens', nbPers: 3, nbEnf: 2 },
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
    observation: ' ',
    statut: 'Validé',
    priorite: 'Basse',
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

const statutBadgeClass = (s: Tache['statut']) => {
  const base = 'px-2 py-0.5 rounded text-xs font-medium transition-colors';
  switch (s) {
    case 'À traiter':     return `${base} bg-amber-400 text-black dark:bg-amber-500`;
    case 'En traitement': return `${base} bg-blue-600 text-white`;
    case 'En suspens':    return `${base} bg-gray-500 text-white dark:bg-gray-600`;
    case 'Validé':        return `${base} bg-emerald-600 text-white`;
    case 'Refusé':        return `${base} bg-red-600 text-white`;
  }
};

const priorityDot = (p: Tache['priorite']) => {
  switch (p) {
    case 'Haute':   return 'bg-red-600';
  }
};

const age = (isoBirth: string) => {
  const d = parseISO(isoBirth);
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return a;
};

// -----------------------------
// Tri
// -----------------------------
type SortKey = 'id' | 'reception' | 'statut' | 'priorite';
type SortDir = 'asc' | 'desc';
const statutOrder: Tache['statut'][] = ['À traiter', 'En traitement', 'En suspens', 'Validé', 'Refusé'];
const prioriteOrder: Tache['priorite'][] = ['Haute', 'Basse'];

// -----------------------------
// Redimensionnement colonnes
// -----------------------------
type ColKey = 'id' | 'reception' | 'motif' | 'voie' | 'par' | 'statut' | 'observation' | 'priorite' | 'actions';

const INITIAL_WIDTHS: Record<ColKey, number> = {
  id: 180,
  reception: 120,
  motif: 160,
  voie: 160,
  par: 100,
  statut: 140,
  observation: 360,
  priorite: 100,
  actions: 180,
};

const MIN_WIDTHS: Record<ColKey, number> = {
  id: 120,
  reception: 110,
  motif: 120,
  voie: 120,
  par: 90,
  statut: 120,
  observation: 240,
  priorite: 90,
  actions: 150,
};

// -----------------------------
// Composant
// -----------------------------
export default function Journal() {
  // STATE: tâches (avec publication depuis la modale)
  const [tasks, setTasks] = useState<Tache[]>(DATA);

  // Filtres
  const [filtreReception, setFiltreReception] = useState<string>('');
  const [filtreMotif, setFiltreMotif] = useState<string>('Tous');
  const [filtreVoie, setFiltreVoie] = useState<string>('Tous');
  const [filtrePar, setFiltrePar] = useState<string>('Tous');
  const [filtreStatut, setFiltreStatut] = useState<string>('Tous');
  const [filtrePriorite, setFiltrePriorite] = useState<string>('Toutes');

  // Recherche (debounced)
  const [searchRaw, setSearchRaw] = useState('');
  const [search, setSearch] = useState('');
  const [isPending, startTransition] = useTransition();
  const [showSkeleton, setShowSkeleton] = useState(false);

  // Détails + modale
  const [openRows, setOpenRows] = useState<Record<string, boolean>>({});
  const [openNew, setOpenNew] = useState(false);

  // Bouton global pour afficher/masquer toutes les personnes
  const [showAllPersons, setShowAllPersons] = useState(false);

  // Tri
  const [sortKey, setSortKey] = useState<SortKey>('reception');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Largeurs colonnes
  const [colWidths, setColWidths] = useState<Record<ColKey, number>>(INITIAL_WIDTHS);
  const dragState = useRef<{ key: ColKey | null; startX: number; startW: number } | null>(null);
  const resizeStartRef = useRef<(key: ColKey, startX: number) => void>(() => {});

  // Debounce 300ms
  useEffect(() => {
    const t = setTimeout(() => {
      const start = performance.now();
      startTransition(() => setSearch(searchRaw));
      const timer = setTimeout(() => setShowSkeleton(true), 200);
      Promise.resolve().then(() => {
        const elapsed = performance.now() - start;
        if (elapsed < 200) { clearTimeout(timer); setShowSkeleton(false); }
      });
    }, 300);
    return () => clearTimeout(t);
  }, [searchRaw, startTransition]);

  // Options dynamiques
  const optionsReception = useMemo(() => {
    const set = new Set(tasks.map(d => d.reception));
    return Array.from(set).sort((a, b) => (a < b ? -1 : 1));
  }, [tasks]);

  const optionsPar = useMemo(() => {
    const set = new Set(tasks.map(d => initials3(d.par)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [tasks]);

  // Filtrage + recherche
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (filtreReception && t.reception !== filtreReception) return false;
      if (filtreMotif !== 'Tous' && t.motif !== filtreMotif) return false;
      if (filtreVoie !== 'Tous' && t.voie !== filtreVoie) return false;
      if (filtrePar !== 'Tous' && initials3(t.par) !== filtrePar) return false;
      if (filtreStatut !== 'Tous' && t.statut !== filtreStatut) return false;
      if (filtrePriorite !== 'Toutes' && t.priorite !== (filtrePriorite as any)) return false;

      if (!q) return true;
      const hay = [
        t.id, t.dossier, t.nss, t.observation,
        ...t.utilisateurs.map(u => `${u.nom} ${u.prenom} ${fmt(u.dateNaissance)}`),
      ].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [search, filtreReception, filtreMotif, filtreVoie, filtrePar, filtreStatut, filtrePriorite, tasks]);

  // Tri
  const results = useMemo(() => {
    const arr = [...filtered];
    const factor = sortDir === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      switch (sortKey) {
        case 'id':        return factor * a.id.localeCompare(b.id);
        case 'reception': return factor * a.reception.localeCompare(b.reception);
        case 'statut':    return factor * (statutOrder.indexOf(a.statut) - statutOrder.indexOf(b.statut));
        case 'priorite':  return factor * (prioriteOrder.indexOf(a.priorite) - prioriteOrder.indexOf(b.priorite));
      }
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const toggleRow = (id: string) =>
    setOpenRows(prev => ({ ...prev, [id]: !prev[id] }));

  const isRowOpen = (id: string) => showAllPersons || !!openRows[id];

  const actionsFor = (s: Tache['statut']) => {
    if (s === 'Validé') return ['🔄', '🔍'];
    if (s === 'En traitement') return ['🔍'];
    return ['✏️', '↪️'];
  };

  // ----- Redimensionnement -----
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const d = dragState.current;
      if (!d || !d.key) return;
      const dx = e.clientX - d.startX;
      setColWidths(prev => {
        const next = { ...prev };
        const min = MIN_WIDTHS[d.key];
        next[d.key] = Math.max(min, d.startW + dx);
        return next;
      });
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    };
    const onUp = () => {
      dragState.current = null;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    const start = (key: ColKey, startX: number) => {
      dragState.current = { key, startX, startW: colWidths[key] };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    };
    (resizeStartRef as any).current = start;
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [colWidths]);

  const onResizeMouseDown = (key: ColKey) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizeStartRef.current(key, e.clientX);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  // UI util
  const FilterWrap: React.FC<{ label: string; active: boolean; onClear?: () => void; children: React.ReactNode }>
    = ({ label, active, onClear, children }) => (
      <div className="relative">
        <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">{label}</label>
        {children}
        {active && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2 top-[34px] -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            aria-label={`Effacer filtre ${label}`}
          >
            ×
          </button>
        )}
      </div>
    );

  return (
    <div className="max-w-[1280px] mx-auto p-6 space-y-4">
      {/* CTA principal */}
      <div className="flex justify-center">
        <button
          className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-white shadow hover:scale-[1.01] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
          aria-label="Créer une nouvelle entrée"
          onClick={() => setOpenNew(true)}
        >
          <LogIn className="h-4 w-4" /> Entrée
        </button>
      </div>

      {/* Filtres + recherche */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
            <FilterWrap label="Réception" active={!!filtreReception} onClear={() => setFiltreReception('')}>
              <select
                className="w-full h-10 rounded border border-gray-300 bg-white dark:bg-neutral-900 p-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
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
              <select
                className="w-full h-10 rounded border border-gray-300 bg-white dark:bg-neutral-900 p-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
                value={filtreMotif}
                onChange={(e) => setFiltreMotif(e.target.value)}
              >
                {['Tous', 'Inscription', 'Renouvellement', 'Mise à jour', 'Contrôle', 'Résiliation', 'Préfecture', 'Gérance'].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </FilterWrap>

            <FilterWrap label="Voie" active={filtreVoie !== 'Tous'} onClear={() => setFiltreVoie('Tous')}>
              <select
                className="w-full h-10 rounded border border-gray-300 bg-white dark:bg-neutral-900 p-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
                value={filtreVoie}
                onChange={(e) => setFiltreVoie(e.target.value)}
              >
                {['Tous', 'Guichet', 'Courrier', 'Email', 'Jaxform', 'Collaborateur'].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </FilterWrap>

            <FilterWrap label="Par" active={filtrePar !== 'Tous'} onClear={() => setFiltrePar('Tous')}>
              <select
                className="w-full h-10 rounded border border-gray-300 bg-white dark:bg-neutral-900 p-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
                value={filtrePar}
                onChange={(e) => setFiltrePar(e.target.value)}
              >
                <option value="Tous">Tous</option>
                {optionsPar.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </FilterWrap>

            <FilterWrap label="Statut" active={filtreStatut !== 'Tous'} onClear={() => setFiltreStatut('Tous')}>
              <select
                className="w-full h-10 rounded border border-gray-300 bg-white dark:bg-neutral-900 p-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
                value={filtreStatut}
                onChange={(e) => setFiltreStatut(e.target.value)}
              >
                {['Tous', 'À traiter', 'En traitement', 'En suspens', 'Validé', 'Refusé'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </FilterWrap>

            <FilterWrap label="Priorité" active={filtrePriorite !== 'Toutes'} onClear={() => setFiltrePriorite('Toutes')}>
              <select
                className="w-full h-10 rounded border p-2"
                value={filtrePriorite}
                onChange={(e) => setFiltrePriorite(e.target.value)}
              >
                {['Toutes', 'Haute', 'Basse'].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </FilterWrap>

            {/* Recherche + bouton "Afficher personnes" */}
            <div className="sm:col-span-7">
              <div className="flex items-center gap-3">
                <div className="relative w-full">
                  <Search className="absolute left-2.5 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchRaw}
                    onChange={(e) => setSearchRaw(e.target.value)}
                    placeholder="Rechercher (ID, Nom, Prénom, NSS, N° de dossier, Date de naissance, Observation)"
                    className="w-full h-10 rounded border border-gray-300 bg-white dark:bg-neutral-900 p-2 pl-9 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
                    aria-label="Recherche globale"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowAllPersons(s => !s)}
                  className="h-10 whitespace-nowrap rounded border border-gray-300 bg-white dark:bg-neutral-900 px-3 text-sm hover:bg-gray-50 dark:hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
                  title={showAllPersons ? 'Masquer les personnes de tous les dossiers' : 'Afficher les personnes de tous les dossiers'}
                >
                  {showAllPersons ? 'Masquer personnes' : 'Afficher personnes'}
                </button>
              </div>
              <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                {results.length} résultat{results.length > 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loader si calcul long */}
      {(isPending && showSkeleton) && (
        <div className="animate-pulse space-y-2">
          <div className="h-4 w-1/3 bg-gray-200 rounded" />
          <div className="h-24 w-full bg-gray-200 rounded" />
        </div>
      )}

      {/* Table desktop */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm text-left">
              <colgroup>
                <col style={{ width: INITIAL_WIDTHS.id }} />
                <col style={{ width: INITIAL_WIDTHS.reception }} />
                <col style={{ width: INITIAL_WIDTHS.motif }} />
                <col style={{ width: INITIAL_WIDTHS.voie }} />
                <col style={{ width: INITIAL_WIDTHS.par }} />
                <col style={{ width: INITIAL_WIDTHS.statut }} />
                <col style={{ width: INITIAL_WIDTHS.observation }} />
                <col style={{ width: INITIAL_WIDTHS.priorite }} />
                <col style={{ width: INITIAL_WIDTHS.actions }} />
              </colgroup>

              <thead className="sticky top-0 z-10 bg-gray-100 dark:bg-neutral-900 uppercase text-xs text-gray-600 dark:text-gray-400">
                <tr>
                  <ThResizable
                    label="ID"
                    sortActive={sortKey === 'id'}
                    sortDir={sortDir}
                    onSort={() => toggleSort('id')}
                    onResizeMouseDown={() => {}}
                  />
                  <ThResizable
                    label="Réception"
                    sortActive={sortKey === 'reception'}
                    sortDir={sortDir}
                    onSort={() => toggleSort('reception')}
                    onResizeMouseDown={() => {}}
                  />
                  <ThResizable label="Motif" onResizeMouseDown={() => {}} />
                  <ThResizable label="Voie" onResizeMouseDown={() => {}} />
                  <ThResizable label="Par" onResizeMouseDown={() => {}} />
                  <ThResizable
                    label="Statut"
                    sortActive={sortKey === 'statut'}
                    sortDir={sortDir}
                    onSort={() => toggleSort('statut')}
                    onResizeMouseDown={() => {}}
                  />
                  <ThResizable label="Observation" onResizeMouseDown={() => {}} />
                  <ThResizable
                    label="📊"
                    sortActive={sortKey === 'priorite'}
                    sortDir={sortDir}
                    onSort={() => toggleSort('priorite')}
                    onResizeMouseDown={() => {}}
                  />
                  <ThResizable label="Actions" onResizeMouseDown={() => {}} />
                </tr>
              </thead>

              <tbody>
                {results.map((t) => (
                  <React.Fragment key={t.id}>
                    <tr
                      className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 transition-colors"
                      role="button"
                      tabIndex={0}
                      onClick={() => setOpenRows(prev => ({ ...prev, [t.id]: !prev[t.id] }))}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpenRows(prev => ({ ...prev, [t.id]: !prev[t.id] })); } }}
                      aria-expanded={showAllPersons || !!openRows[t.id]}
                    >
                      <td className="p-3 align-top max-w-0">
                        <div className="flex items-center gap-2 truncate">
                          {(showAllPersons || !!openRows[t.id]) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          <span className="underline truncate">{t.id}</span>
                          {t.llm && <span className="ml-1 inline-block h-3 w-3 rounded-full bg-green-500" aria-label="LLM actif" title="LLM activé" />}
                        </div>
                      </td>
                      <td className="p-3 align-top">{fmt(t.reception)}</td>
                      <td className="p-3 align-top">{t.motif}</td>
                      <td className="p-3 align-top">{t.voie}</td>
                      <td className="p-3 align-top">{initials3(t.par)}</td>
                      <td className="p-3 align-top">
                        <Badge className={statutBadgeClass(t.statut)}>{t.statut}</Badge>
                      </td>
                      <td className="p-3 align-top max-w-[36ch]">
                        <div className="truncate" title={t.observation}>{t.observation}</div>
                      </td>
                      <td className="p-3 align-top">
                        <span className={`inline-block h-3 w-3 rounded-full ${priorityDot(t.priorite)}`} aria-label={`Priorité ${t.priorite}`} />
                      </td>
                      <td className="p-3 align-top">
                        <div className="flex gap-3">
                          {(['🔍','🔄','✏️','↪️'] as const)
                            .filter(a => (t.statut === 'Validé' ? ['🔄', '🔍'] : t.statut === 'En traitement' ? ['🔍'] : ['✏️', '↪️']).includes(a))
                            .map(a => (
                            <button
                              key={a}
                              className="underline text-gray-900 dark:text-gray-100 hover:opacity-90"
                              title={
                                a === '🔍' ? 'Consulter' :
                                a === '🔄' ? 'Reprendre' :
                                a === '✏️' ? 'Traiter' :
                                a === '↪️' ? 'Transférer' : ''
                              }
                              onClick={(e) => { e.stopPropagation(); console.log(a, t.id); }}
                            >
                              {a}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>

                    {(showAllPersons || !!openRows[t.id]) && (
                      <tr className="bg-gray-50 dark:bg-white/5">
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

                {results.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-sm text-gray-600 dark:text-gray-400">
                      Aucun résultat. Ajuste les filtres ou vide la recherche.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {results.length === 0 && (
          <div className="rounded border border-gray-200 dark:border-gray-800 p-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Aucun résultat. Ajuste les filtres ou vide la recherche.
          </div>
        )}
        {results.map((t) => (
          <div key={t.id} className="rounded border border-gray-200 dark:border-gray-800 shadow-sm p-3 bg-white dark:bg-neutral-900">
            <button
              className="w-full flex items-center justify-between text-left"
              onClick={() => setOpenRows(prev => ({ ...prev, [t.id]: !prev[t.id] }))}
              aria-expanded={showAllPersons || !!openRows[t.id]}
            >
              <div className="font-medium flex items-center gap-2">
                <span className="underline">{t.id}</span>
                {t.llm && <span className="inline-block h-3 w-3 rounded-full bg-green-500" title="LLM activé" />}
              </div>
              {(showAllPersons || !!openRows[t.id]) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            <div className="mt-2 text-sm grid grid-cols-2 gap-y-1">
              <div className="text-gray-500">Réception</div><div>{fmt(t.reception)}</div>
              <div className="text-gray-500">Motif</div><div>{t.motif}</div>
              <div className="text-gray-500">Voie</div><div>{t.voie}</div>
              <div className="text-gray-500">Par</div><div>{initials3(t.par)}</div>
              <div className="text-gray-500">Statut</div><div><Badge className={statutBadgeClass(t.statut)}>{t.statut}</Badge></div>
              <div className="text-gray-500">Observation</div><div className="col-span-1">{t.observation}</div>
              <div className="text-gray-500">Priorité</div><div><span className={`inline-block h-3 w-3 rounded-full ${priorityDot(t.priorite)}`} /></div>
            </div>
            <div className="mt-2 flex gap-3 text-sm">
              {(['🔍','🔄','✏️','↪️'] as const)
                .filter(a => (t.statut === 'Validé' ? ['🔄', '🔍'] : t.statut === 'En traitement' ? ['🔍'] : ['✏️', '↪️']).includes(a))
                .map(a => (
                <button
                  key={a}
                  className="underline"
                  title={
                    a === '🔍' ? 'Consulter' :
                    a === '🔄' ? 'Reprendre' :
                    a === '✏️' ? 'Traiter' :
                    a === '↪️' ? 'Transférer' : ''
                  }
                  onClick={() => console.log(a, t.id)}
                >
                  {a}
                </button>
              ))}
            </div>
            {(showAllPersons || !!openRows[t.id]) && (
              <div className="mt-3 bg-gray-50 dark:bg-white/5 p-2 rounded">
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

      {/* Modale Nouvelle entrée (publication via onSaved) */}
      <NewEntryModal
        open={openNew}
        onOpenChange={setOpenNew}
        searchUserByNSS={mockSearchUserByNSS}
        saveEntry={mockSaveEntry}
        agentInitials="DBO"
        onSaved={(tache) => {
          // insertion en tête + dépliage
          setTasks(prev => [tache, ...prev]);
          setOpenRows(prev => ({ ...prev, [tache.id]: true }));
        }}
      />
    </div>
  );
}

/* ---------- <th> triable + poignée de resize ---------- */
function ThResizable({
  label,
  sortActive,
  sortDir,
  onSort,
  onResizeMouseDown,
}: {
  label: string;
  sortActive?: boolean;
  sortDir?: 'asc' | 'desc';
  onSort?: () => void;
  onResizeMouseDown: (e: React.MouseEvent) => void;
}) {
  return (
    <th className="p-0 relative select-none group border-transparent">
      <div className="p-3 flex items-center gap-1 uppercase text-xs text-gray-600 dark:text-gray-400">
        {onSort ? (
          <button
            type="button"
            onClick={onSort}
            aria-sort={sortActive ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
            className="inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-200"
          >
            {label}
            <ArrowUpDown className={`h-3.5 w-3.5 ${sortActive ? 'opacity-100' : 'opacity-40'}`} />
          </button>
        ) : (
          <span>{label}</span>
        )}
      </div>
      {/* poignée de redimensionnement */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label={`Redimensionner colonne ${label}`}
        onMouseDown={onResizeMouseDown}
        className="absolute top-0 right-0 h-full w-2 cursor-col-resize group-hover:bg-gray-300/30"
        style={{ touchAction: 'none' }}
      />
    </th>
  );
}
