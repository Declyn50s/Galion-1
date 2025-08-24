import React from 'react';
import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Search, Filter, FileText, Eye, Download, CalendarClock, Tag as TagIcon, X, Plus } from 'lucide-react';

/**
 * Mémento — Page de consultation des procédures LLM
 * - Desktop first, Tailwind + (shadcn/ui)
 * - Recherche (titre, résumé, tags)
 * - Filtres par tags et par date (facultatif mais inclus ici)
 * - Cartes avec actions au survol (voir / télécharger)
 * - Prévisualisation PDF (Dialog + <iframe>)
 * - Code clair, commenté, prêt à être branché à un backend plus tard
 */

// -----------------------------
// Types & Données simulées (mock)
// -----------------------------
export type Procedure = {
  title: string;
  summary: string;
  updatedAt: string; // ISO date (YYYY-MM-DD)
  tags: string[];
  file: string; // chemin ou nom de fichier
};

const proceduresData: Procedure[] = [
  {
    title: 'Procédure de refus limites',
    summary: "Gestion des refus liés aux limites de critères d'attribution.",
    updatedAt: '2025-08-01',
    tags: ['refus', 'limites'],
    file: 'refus-limites.pdf',
  },
  {
    title: 'Procédure accueil',
    summary: 'Accueillir et orienter les demandeurs de logement.',
    updatedAt: '2025-06-22',
    tags: ['accueil', 'orientation'],
    file: 'accueil.pdf',
  },
  {
    title: 'Procédure révision',
    summary: 'Révision annuelle des dossiers.',
    updatedAt: '2025-07-10',
    tags: ['révision', 'dossier'],
    file: 'revision.pdf',
  },
];

// -----------------------------
// Utils
// -----------------------------
const formatDate = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`);
  // Format suisse FR (jj.mm.aaaa)
  return d.toLocaleDateString('fr-CH');
};

const containsCI = (haystack: string, needle: string) => haystack.toLowerCase().includes(needle.toLowerCase());

// -----------------------------
// Composant principal
// -----------------------------
function Memento() {
  // Recherche plein texte
  const [query, setQuery] = useState('');

  // Données (mock) en state pour permettre l'ajout
  const [procedures, setProcedures] = useState<Procedure[]>(proceduresData);

  // Dialogue d'ajout
  const [openAdd, setOpenAdd] = useState(false);
  const [newProc, setNewProc] = useState({
    title: '',
    summary: '',
    tags: '',
    updatedAt: new Date().toISOString().slice(0,10),
    file: '',
  });

  const parseTags = (s: string) =>
    s.split(',').map(t => t.trim()).filter(Boolean);

  const handleAddProcedure = (e: React.FormEvent) => {
    e.preventDefault();
    const proc: Procedure = {
      title: newProc.title.trim(),
      summary: newProc.summary.trim(),
      tags: parseTags(newProc.tags),
      updatedAt: (newProc.updatedAt || new Date().toISOString().slice(0,10)).slice(0,10),
      file: newProc.file.trim(),
    };
    if (!proc.title || !proc.file) return; // mini-validation
    setProcedures(prev => [proc, ...prev]);
    setOpenAdd(false);
    setNewProc({ title: '', summary: '', tags: '', updatedAt: new Date().toISOString().slice(0,10), file: '' });
  };

  // Panneau de filtres
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [updatedAfter, setUpdatedAfter] = useState<string>(''); // YYYY-MM-DD
  const [updatedBefore, setUpdatedBefore] = useState<string>('');

  // Prévisualisation PDF
  const [previewFile, setPreviewFile] = useState<string | null>(null);

  // Liste de tags disponibles (dérivée des données)
  const allTags = useMemo(() => {
    const set = new Set<string>();
    procedures.forEach(p => p.tags.forEach(t => set.add(t)));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'));
  }, []);

  // Filtrage + tri
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();

    const withinDateRange = (dateISO: string) => {
      const ts = new Date(`${dateISO}T00:00:00`).getTime();
      if (updatedAfter) {
        const min = new Date(`${updatedAfter}T00:00:00`).getTime();
        if (ts < min) return false;
      }
      if (updatedBefore) {
        const max = new Date(`${updatedBefore}T23:59:59`).getTime();
        if (ts > max) return false;
      }
      return true;
    };

    return procedures
      .filter(p => {
        // Recherche plein texte: titre, résumé, tags
        const hay = `${p.title} ${p.summary} ${p.tags.join(' ')}`.toLowerCase();
        const passQuery = q ? hay.includes(q) : true;

        // Filtres tags: tous les tags sélectionnés doivent être présents
        const passTags = selectedTags.length
          ? selectedTags.every(t => p.tags.map(x => x.toLowerCase()).includes(t.toLowerCase()))
          : true;

        const passDate = withinDateRange(p.updatedAt);

        return passQuery && passTags && passDate;
      })
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)); // plus récent d'abord
  }, [query, selectedTags, updatedAfter, updatedBefore]);

  const clearFilters = () => {
    setSelectedTags([]);
    setUpdatedAfter('');
    setUpdatedBefore('');
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]));
  };

  // Chemin des fichiers (à adapter à votre app / CDN)
  const fileHref = (file: string) => `/files/${file}`; // ex: public/files/<nom>.pdf

  return (
    <TooltipProvider>
      <div className="mx-auto max-w-[1200px]">
        {/* Barre d'actions */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="relative w-[520px] max-w-full">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" aria-hidden />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une procédure (titre, résumé, tag)"
              className="pl-10"
              aria-label="Rechercher une procédure"
            />
          </div>

          <div className="flex items-center gap-2">
            {(query || selectedTags.length || updatedAfter || updatedBefore) ? (
              <Button variant="ghost" onClick={() => { setQuery(''); clearFilters(); }} aria-label="Effacer la recherche et les filtres">
                <X className="h-4 w-4 mr-2" /> Effacer
              </Button>
            ) : null}

            <Button onClick={() => setOpenAdd(true)} aria-label="Ajouter une procédure">
              <Plus className="h-4 w-4 mr-2" /> Ajouter
            </Button>

            <Button variant="secondary" onClick={() => setFiltersOpen((v) => !v)} aria-expanded={filtersOpen} aria-controls="memento-filters">
              <Filter className="h-4 w-4 mr-2" /> Filtres
            </Button>
          </div>
        </div>

        {/* Panneau Filtres (léger, desktop-first) */}
        {filtersOpen && (
          <div id="memento-filters" className="mb-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                  <TagIcon className="h-4 w-4" /> Tags
                </div>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((t) => (
                    <button
                      key={t}
                      onClick={() => toggleTag(t)}
                      className={`px-2 py-1 rounded-md border text-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
                        selectedTags.includes(t)
                          ? 'bg-blue-50 text-blue-700 border-blue-200 focus:ring-blue-500'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 focus:ring-slate-400'
                      }`}
                      aria-pressed={selectedTags.includes(t)}
                      aria-label={`Filtrer par tag ${t}`}
                    >
                      #{t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                  <CalendarClock className="h-4 w-4" /> Date de mise à jour
                </div>
                <div className="flex items-center gap-3">
                  <div className="space-y-1">
                    <label htmlFor="updatedAfter" className="text-xs text-slate-500">Après le</label>
                    <Input id="updatedAfter" type="date" value={updatedAfter} onChange={(e) => setUpdatedAfter(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="updatedBefore" className="text-xs text-slate-500">Avant le</label>
                    <Input id="updatedBefore" type="date" value={updatedBefore} onChange={(e) => setUpdatedBefore(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="flex items-end justify-end">
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={clearFilters}><X className="h-4 w-4 mr-2" />Réinitialiser</Button>
                  <Button onClick={() => setFiltersOpen(false)}>Appliquer</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Résumé */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {results.length} procédure{results.length > 1 ? 's' : ''} affichée{results.length > 1 ? 's' : ''}
            {selectedTags.length > 0 && (
              <>
                {' '}• tags: {selectedTags.map(t => `#${t}`).join(', ')}
              </>
            )}
          </div>
        </div>

        {/* Grille des cartes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((p) => (
            <Card key={p.title} className="relative group overflow-hidden border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-base leading-snug line-clamp-2">{p.title}</CardTitle>
                <CardDescription className="line-clamp-2">{p.summary}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                  <CalendarClock className="h-4 w-4" aria-hidden />
                  <span>Mis à jour le {formatDate(p.updatedAt)}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {p.tags.map((t) => (
                    <button key={t} onClick={() => toggleTag(t)} className="focus:outline-none" aria-label={`Filtrer par tag ${t}`}>
                      <Badge variant="secondary" className="cursor-pointer">#{t}</Badge>
                    </button>
                  ))}
                </div>
              </CardContent>

              {/* Actions au survol */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 bg-slate-900/0 opacity-0 transition group-hover:bg-slate-900/5 group-hover:opacity-100">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      className="pointer-events-auto"
                      onClick={() => setPreviewFile(p.file)}
                      aria-label={`Prévisualiser ${p.file}`}
                    >
                      <Eye className="h-4 w-4 mr-2" /> Voir
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Prévisualiser</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      className="pointer-events-auto"
                      href={fileHref(p.file)}
                      download
                      aria-label={`Télécharger ${p.file}`}
                    >
                      <Button variant="secondary" size="sm">
                        <Download className="h-4 w-4 mr-2" /> Télécharger
                      </Button>
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>Télécharger le fichier</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      className="pointer-events-auto"
                      href={fileHref(p.file)}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label={`Ouvrir ${p.file} dans un nouvel onglet`}
                    >
                      <Button variant="ghost" size="sm">
                        <FileText className="h-4 w-4 mr-2" /> Ouvrir
                      </Button>
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>Ouvrir dans un nouvel onglet</TooltipContent>
                </Tooltip>
              </div>
            </Card>
          ))}
        </div>

        {/* Alerte aucun résultat */}
        {results.length === 0 && (
          <div className="mt-10 rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-600 dark:text-slate-300">
            Aucune procédure ne correspond à votre recherche.
          </div>
        )}
      </div>

      {/* Ajout d'une procédure */}
      <Dialog open={openAdd} onOpenChange={setOpenAdd}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ajouter une procédure</DialogTitle>
            <DialogDescription>Renseignez les champs ci-dessous.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddProcedure} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <label className="text-sm text-slate-600">Titre</label>
                <Input
                  value={newProc.title}
                  onChange={(e) => setNewProc({ ...newProc, title: e.target.value })}
                  placeholder="Nom de la procédure"
                  required
                />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-sm text-slate-600">Résumé</label>
                <textarea
                  value={newProc.summary}
                  onChange={(e) => setNewProc({ ...newProc, summary: e.target.value })}
                  placeholder="Résumé de la procédure"
                  className="min-h-[90px] w-full rounded-md border border-slate-200 bg-white p-2 text-sm outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-slate-600">Tags (séparés par des virgules)</label>
                <Input
                  value={newProc.tags}
                  onChange={(e) => setNewProc({ ...newProc, tags: e.target.value })}
                  placeholder="ex: accueil, orientation"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-slate-600">Date de mise à jour</label>
                <Input
                  type="date"
                  value={newProc.updatedAt}
                  onChange={(e) => setNewProc({ ...newProc, updatedAt: e.target.value })}
                />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-sm text-slate-600">Fichier (nom ou chemin)</label>
                <Input
                  value={newProc.file}
                  onChange={(e) => setNewProc({ ...newProc, file: e.target.value })}
                  placeholder="ex: accueil.pdf"
                  required
                />
                <p className="text-xs text-slate-500">Les fichiers sont servis depuis <code>/files/</code> par défaut.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpenAdd(false)}>Annuler</Button>
              <Button type="submit"><Plus className="h-4 w-4 mr-2" />Ajouter</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Prévisualisation PDF */}
      <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Prévisualisation</DialogTitle>
            <DialogDescription className="truncate text-slate-600">
              {previewFile}
            </DialogDescription>
          </DialogHeader>
          <div className="aspect-[4/3] w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
            {/* Remplacez le chemin ci-dessous selon l'emplacement réel de vos fichiers */}
            {previewFile ? (
              <iframe
                title={`Preview ${previewFile}`}
                src={fileHref(previewFile)}
                className="h-full w-full"
              />
            ) : null}
          </div>
          <div className="flex items-center justify-end gap-2">
            {previewFile && (
              <a href={fileHref(previewFile)} target="_blank" rel="noreferrer noopener">
                <Button variant="secondary"><FileText className="h-4 w-4 mr-2" />Ouvrir dans un onglet</Button>
              </a>
            )}
            {previewFile && (
              <a href={fileHref(previewFile)} download>
                <Button><Download className="h-4 w-4 mr-2" />Télécharger</Button>
              </a>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}

export { Memento };
export default Memento;
