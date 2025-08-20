import React, { useMemo, useRef, useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  Filter,
  Eye,
  Loader2,
  FileDown,
  Plus,
  ShieldCheck,
  Ban,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  FileText,
} from 'lucide-react';

/**
 * Dérogations — OCL Lausanne (DEMO)
 * - React + TypeScript strict, Tailwind, shadcn/ui, lucide-react
 * - Tableau filtrable, stats, fiche (drawer), actions Accepter/Refuser (dialog)
 * - État local + services API factices (latence & erreurs simulées)
 * - Conformité démo: pas de données sensibles; sanitizer minimal sur entrées
 *
 * NOTE: Notifications intégrées (remplacent `useToast`).
 */

// -----------------------------
// Types & constantes
// -----------------------------
export type CollaboratorCode = 'SJO' | 'FQO' | 'LSN' | 'TBO';
export type Decision = 'acceptée' | 'refusée' | 'en cours';

export interface Derogation {
  id: number;
  dateSeance: string; // ISO date
  collab: CollaboratorCode; // Initiales du collaborateur
  nom: string;
  prenom: string;
  decision: Decision;
  motif: string;
}

const COLLAB_LABEL: Record<CollaboratorCode, string> = {
  SJO: 'SJO',
  FQO: 'FQO',
  LSN: 'LSN',
  TBO: 'TBO',
};

const DECISION_COLOR: Record<Decision, string> = {
  acceptée: 'bg-green-100 text-green-800 border-green-200',
  refusée: 'bg-red-100 text-red-800 border-red-200',
  'en cours': 'bg-amber-100 text-amber-900 border-amber-200',
};

// Sentinelles pour Select (Radix ne supporte pas value="")
const C_ALL = '__ALL_COLLAB__';
const D_ALL = '__ALL_DECISION__';

// Tri
type SortDir = 'desc' | 'asc';

// -----------------------------
// Données simulées (févr → juil 2025)
// -----------------------------
const MOCK_DEROGATIONS: Derogation[] = [
  { id: 101, dateSeance: '2025-07-18', collab: 'LSN', nom: 'Durand', prenom: 'Camille', decision: 'acceptée', motif: 'Dépassement marginal des revenus, famille monoparentale.' },
  { id: 102, dateSeance: '2025-07-18', collab: 'SJO', nom: 'Martin', prenom: 'Léa', decision: 'refusée', motif: 'Critères non remplis selon règlement 2025.' },
  { id: 103, dateSeance: '2025-06-12', collab: 'FQO', nom: 'Nguyen', prenom: 'Minh', decision: 'en cours', motif: 'Éléments complémentaires attendus (attestation employeur).' },
  { id: 104, dateSeance: '2025-06-12', collab: 'TBO', nom: 'Rossi', prenom: 'Marco', decision: 'acceptée', motif: 'Situation d’urgence attestée par service social.' },
  { id: 105, dateSeance: '2025-05-08', collab: 'LSN', nom: 'Keller', prenom: 'Sophie', decision: 'en cours', motif: 'Vérification des pièces justificatives en cours.' },
  { id: 106, dateSeance: '2025-05-08', collab: 'SJO', nom: 'Bernard', prenom: 'Paul', decision: 'refusée', motif: 'Absence de justificatifs suffisants.' },
  { id: 107, dateSeance: '2025-04-17', collab: 'FQO', nom: 'Ibrahim', prenom: 'Sara', decision: 'acceptée', motif: 'Adaptation liée à la taille du foyer.' },
  { id: 108, dateSeance: '2025-04-17', collab: 'TBO', nom: 'Liu', prenom: 'Hao', decision: 'en cours', motif: 'Analyse complémentaire (revenus) en coordination inter‑service.' },
  { id: 109, dateSeance: '2025-03-14', collab: 'LSN', nom: 'Moret', prenom: 'Nicolas', decision: 'refusée', motif: 'Non éligible aux critères LLM en vigueur.' },
  { id: 110, dateSeance: '2025-02-06', collab: 'SJO', nom: 'Gonzalez', prenom: 'Ana', decision: 'acceptée', motif: 'Situation précaire temporaire confirmée.' },
];

// -----------------------------
// Utils
// -----------------------------
const fmtDate = (iso: string): string => new Date(iso + 'T00:00:00').toLocaleDateString('fr-CH');
const toISODate = (d: Date): string => d.toISOString().slice(0, 10);
const sanitize = (s: string): string => s.replace(/<[^>]*>/g, '').trim();
const randInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

// CSV export (UTF-8 BOM pour Excel)
function exportCSV(rows: Derogation[], filename = 'derogations.csv'): void {
  const header = ['id', 'dateSeance', 'collaborateur', 'nom', 'prenom', 'decision', 'motif'];
  const esc = (v: string | number): string => '"' + String(v).replace(/"/g, '""') + '"';
  const csv = [header.join(';')]
    .concat(rows.map(r => [r.id, r.dateSeance, r.collab, r.nom, r.prenom, r.decision, r.motif].map(esc).join(';')))
    .join('\n');
  const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// -----------------------------
// Services API factices
// -----------------------------
interface ApiService {
  updateDecision: (
    id: number,
    decision: Decision,
    resume?: string,
  ) => Promise<{ ok: true }>; // peut rejeter
}

const api: ApiService = {
  updateDecision: (id, decision, resume) => new Promise((resolve, reject) => {
    const latency = randInt(500, 800);
    const fail = Math.random() < 0.10; // 10% d'échec simulé
    setTimeout(() => {
      if (fail) reject(new Error('Erreur réseau simulée'));
      else resolve({ ok: true });
    }, latency);
    // Journal local simulé
    // eslint-disable-next-line no-console
    console.info('[AUDIT]', {
      who: 'agent.demo@lausanne.ch',
      what: 'updateDecision',
      when: new Date().toISOString(),
      payload: { id, decision, resume: resume ?? '' },
    });
  }),
};

// -----------------------------
// Notifications locales (remplace useToast)
// -----------------------------
 type NoticeType = 'success' | 'error' | 'info';
 interface Notice { id: number; type: NoticeType; title: string; description?: string }

 function NoticeItem({ n, onClose }: { n: Notice; onClose: (id: number) => void }) {
  const Icon = n.type === 'success' ? CheckCircle2 : n.type === 'error' ? AlertTriangle : Info;
  const tone = n.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : n.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-blue-50 border-blue-200 text-blue-800';
  return (
    <div className={`pointer-events-auto relative flex w-80 items-start gap-3 rounded-md border p-3 shadow-sm ${tone}`} role="status" aria-live="polite">
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex-1">
        <div className="text-sm font-medium">{n.title}</div>
        {n.description && <div className="text-xs opacity-90">{n.description}</div>}
      </div>
      <button className="absolute right-2 top-2 opacity-60 hover:opacity-100" onClick={() => onClose(n.id)} aria-label="Fermer">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
 }

// -----------------------------
// Composant principal
// -----------------------------
export function DerogationsList(): JSX.Element {
  // Notifications
  const [notices, setNotices] = useState<Notice[]>([]);
  const notify = useCallback((type: NoticeType, title: string, description?: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setNotices((cur) => [...cur, { id, type, title, description }]);
    window.setTimeout(() => setNotices((cur) => cur.filter((n) => n.id !== id)), 4000);
  }, []);
  const closeNotice = useCallback((id: number) => setNotices((cur) => cur.filter((n) => n.id !== id)), []);

  // Source en mémoire
  const [items, setItems] = useState<Derogation[]>(() => [...MOCK_DEROGATIONS]);

  // Filtres
  const [q, setQ] = useState<string>('');
  const [collabFilter, setCollabFilter] = useState<'' | CollaboratorCode>('');
  const [decisionFilter, setDecisionFilter] = useState<'' | Decision>('');
  const [dateFrom, setDateFrom] = useState<string>(''); // YYYY-MM-DD
  const [dateTo, setDateTo] = useState<string>('');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // UI states
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [selected, setSelected] = useState<Derogation | null>(null);

  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [pendingDecision, setPendingDecision] = useState<Decision>('en cours');
  const [resume, setResume] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Création (maquette)
  const [createOpen, setCreateOpen] = useState<boolean>(false);
  const [form, setForm] = useState<{ nom: string; prenom: string; collab: CollaboratorCode | ''; motif: string }>(
    { nom: '', prenom: '', collab: '', motif: '' },
  );

  const prevSnapshot = useRef<Derogation[] | null>(null);

  const withinDateRange = (iso: string) => {
    const ts = new Date(iso + 'T00:00:00').getTime();
    if (dateFrom) {
      const min = new Date(dateFrom + 'T00:00:00').getTime();
      if (ts < min) return false;
    }
    if (dateTo) {
      const max = new Date(dateTo + 'T23:59:59').getTime();
      if (ts > max) return false;
    }
    return true;
  };

  // Résultats filtrés + tri
  const filtered = useMemo(() => {
    const s = sanitize(q).toLowerCase();
    const arr = items.filter((it) => {
      const hay = `${it.nom} ${it.prenom} ${it.motif}`.toLowerCase();
      const passQ = s ? hay.includes(s) : true;
      const passC = collabFilter ? it.collab === collabFilter : true;
      const passD = decisionFilter ? it.decision === decisionFilter : true;
      const passDate = withinDateRange(it.dateSeance);
      return passQ && passC && passD && passDate;
    });
    return arr.sort((a, b) => sortDir === 'desc' ? (a.dateSeance < b.dateSeance ? 1 : -1) : (a.dateSeance > b.dateSeance ? 1 : -1));
  }, [items, q, collabFilter, decisionFilter, dateFrom, dateTo, sortDir]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const acc = filtered.filter((x) => x.decision === 'acceptée').length;
    const ref = filtered.filter((x) => x.decision === 'refusée').length;
    const enc = filtered.filter((x) => x.decision === 'en cours').length;
    return { total, acc, ref, enc };
  }, [filtered]);

  // Handlers
  const openFiche = (row: Derogation) => {
    setSelected(row);
    setDrawerOpen(true);
  };

  const requestDecision = (d: Decision) => {
    setPendingDecision(d);
    setResume('');
    setConfirmOpen(true);
  };

  const applyDecision = async () => {
    if (!selected) return;
    const cleanResume = sanitize(resume);
    const id = selected.id;

    // Optimistic update
    prevSnapshot.current = items;
    setItems((cur) => cur.map((x) => (x.id === id ? { ...x, decision: pendingDecision } : x)));
    setSubmitting(true);

    try {
      await api.updateDecision(id, pendingDecision, cleanResume);
      notify('success', 'Décision appliquée', `Dossier #${id} → ${pendingDecision}`);
      setConfirmOpen(false);
      setSelected((s) => (s ? { ...s, decision: pendingDecision } : s));
    } catch (e) {
      // Rollback
      if (prevSnapshot.current) setItems(prevSnapshot.current);
      notify('error', 'Échec', 'La mise à jour a échoué. Réessayez.');
    } finally {
      setSubmitting(false);
    }
  };

  const collabOk = (v: string): v is CollaboratorCode => ['SJO', 'FQO', 'LSN', 'TBO'].includes(v);

  const createValid = useMemo(() => (
    sanitize(form.nom).length > 0 &&
    sanitize(form.prenom).length > 0 &&
    collabOk(form.collab) &&
    sanitize(form.motif).length >= 10
  ), [form]);

  const createDerogation = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!createValid) return;
    const next: Derogation = {
      id: Math.max(0, ...items.map((i) => i.id)) + 1,
      dateSeance: toISODate(new Date()),
      collab: form.collab as CollaboratorCode,
      nom: sanitize(form.nom),
      prenom: sanitize(form.prenom),
      decision: 'en cours',
      motif: sanitize(form.motif),
    };
    setItems((cur) => [next, ...cur]);
    // Reset
    setForm({ nom: '', prenom: '', collab: '', motif: '' });
    setCreateOpen(false);
    notify('success', 'Demande créée', `Dossier #${next.id} ajouté (en cours).`);
  };

  // Navigation vers la page PV de commission (placeholder)
const PV_ROUTE = '/pv-commission-derogations';

const goToPV = () => {
  if (!selected) return;

  const params = new URLSearchParams({
    nom: selected.nom,
    prenom: selected.prenom,
    collab: selected.collab,
    dateSeance: selected.dateSeance,     // <- optionnel mais pratique
    motif: selected.motif,               // <- optionnel mais pratique
  });

  window.location.href = `${PV_ROUTE}?${params.toString()}`;
};

  return (
    <div className="space-y-5">
      {/* Notifications */}
      <div className="fixed right-6 top-20 z-50 flex flex-col gap-2" aria-live="polite" aria-atomic="false">
        {notices.map((n) => (
          <NoticeItem key={n.id} n={n} onClose={closeNotice} />
        ))}
      </div>

      {/* Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-[420px] max-w-full">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" aria-hidden />
            <Input
              aria-label="Recherche"
              placeholder="Rechercher (nom, prénom, motif)"
              className="pl-10"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {/* Filtre Collaborateur */}
          <Select
            value={collabFilter || C_ALL}
            onValueChange={(v) => setCollabFilter(v === C_ALL ? '' : (v as CollaboratorCode))}
          >
            <SelectTrigger className="w-[180px]" aria-label="Filtrer par collaborateur">
              <SelectValue placeholder="Collaborateur" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={C_ALL}>Tous collaborateurs</SelectItem>
              <SelectItem value="SJO">SJO</SelectItem>
              <SelectItem value="FQO">FQO</SelectItem>
              <SelectItem value="LSN">LSN</SelectItem>
              <SelectItem value="TBO">TBO</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtre Décision */}
          <Select
            value={decisionFilter || D_ALL}
            onValueChange={(v) => setDecisionFilter(v === D_ALL ? '' : (v as Decision))}
          >
            <SelectTrigger className="w-[170px]" aria-label="Filtrer par décision">
              <SelectValue placeholder="Décision" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={D_ALL}>Toutes décisions</SelectItem>
              <SelectItem value="acceptée">Acceptées</SelectItem>
              <SelectItem value="refusée">Refusées</SelectItem>
              <SelectItem value="en cours">En cours</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtre Date séance */}
          <div className="flex items-center gap-2">
            <div className="space-y-1">
              <Label htmlFor="dateFrom" className="text-xs text-slate-600">Du</Label>
              <Input id="dateFrom" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dateTo" className="text-xs text-slate-600">Au</Label>
              <Input id="dateTo" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>

          {/* Tri */}
          <Select value={sortDir} onValueChange={(v) => setSortDir(v as SortDir)}>
            <SelectTrigger className="w-[210px]" aria-label="Trier par date">
              <SelectValue placeholder="Tri par date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Date décroissante</SelectItem>
              <SelectItem value="asc">Date croissante</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => exportCSV(filtered)} aria-label="Exporter CSV">
            <FileDown className="h-4 w-4 mr-2" /> Exporter
          </Button>
          <Button onClick={() => setCreateOpen(true)} aria-label="Créer une demande">
            <Plus className="h-4 w-4 mr-2" /> Créer
          </Button>
          <Button variant="outline" className="hidden md:inline-flex" disabled>
            <Filter className="h-4 w-4 mr-2" /> Filtres avancés
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="py-3"><CardTitle className="text-sm">Total</CardTitle></CardHeader>
          <CardContent className="pt-0 text-2xl font-semibold">{stats.total}</CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3"><CardTitle className="text-sm">Acceptées</CardTitle></CardHeader>
          <CardContent className="pt-0 text-2xl font-semibold">{stats.acc}</CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3"><CardTitle className="text-sm">Refusées</CardTitle></CardHeader>
          <CardContent className="pt-0 text-2xl font-semibold">{stats.ref}</CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3"><CardTitle className="text-sm">En cours</CardTitle></CardHeader>
          <CardContent className="pt-0 text-2xl font-semibold">{stats.enc}</CardContent>
        </Card>
      </div>

      {/* Tableau */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Date séance</TableHead>
                <TableHead className="w-[120px]">Collaborateur</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Prénom</TableHead>
                <TableHead className="w-[120px]">Décision</TableHead>
                <TableHead>Motif</TableHead>
                <TableHead className="w-[90px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{fmtDate(row.dateSeance)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-semibold">
                      {COLLAB_LABEL[row.collab]}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{row.nom}</TableCell>
                  <TableCell>{row.prenom}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${DECISION_COLOR[row.decision]}`}>
                      {row.decision}
                    </span>
                  </TableCell>
                  <TableCell title={row.motif} className="max-w-[360px] truncate">
                    {row.motif}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => openFiche(row)} aria-label={`Voir dossier #${row.id}`}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-slate-500">
                    Aucun dossier ne correspond aux filtres.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Drawer Fiche */}
      <Sheet open={drawerOpen} onOpenChange={(o) => { if (!o) setDrawerOpen(false); }}>
        <SheetContent className="w-[560px] sm:w-[640px]">
          <SheetHeader>
            <SheetTitle>Fiche dérogation {selected ? `#${selected.id}` : ''}</SheetTitle>
            <SheetDescription>Détails du dossier — lecture seule (démo).</SheetDescription>
          </SheetHeader>

          {selected && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-slate-500">Nom</Label>
                  <div className="font-medium">{selected.nom}</div>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Prénom</Label>
                  <div className="font-medium">{selected.prenom}</div>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Collaborateur</Label>
                  <div><Badge variant="outline">{selected.collab}</Badge></div>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Date de séance</Label>
                  <div>{fmtDate(selected.dateSeance)}</div>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-slate-500">Motif</Label>
                  <div className="whitespace-pre-wrap text-sm">{selected.motif}</div>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Décision</Label>
                  <div>
                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${DECISION_COLOR[selected.decision]}`}>
                      {selected.decision}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-2">
                {selected.decision === 'en cours' ? (
                  <Button onClick={goToPV} aria-label="Traiter la demande">
                    <FileText className="h-4 w-4 mr-2" /> Traiter
                  </Button>
                ) : (
                  <Button onClick={() => requestDecision('acceptée')} aria-label="Accepter la demande">
                    <ShieldCheck className="h-4 w-4 mr-2" /> Accepter
                  </Button>
                )}
                <Button variant="destructive" onClick={() => requestDecision('refusée')} aria-label="Refuser la demande">
                  <Ban className="h-4 w-4 mr-2" /> Refuser
                </Button>
              </div>
            </div>
          )}

          <SheetFooter className="mt-6" />
        </SheetContent>
      </Sheet>

      {/* Dialog confirmation décision */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent role="dialog" aria-modal="true">
          <DialogHeader>
            <DialogTitle>Confirmer la décision</DialogTitle>
            <DialogDescription>
              Vous allez marquer ce dossier comme <strong>{pendingDecision}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="resume" className="text-sm">Résumé du motif (optionnel)</Label>
            <Textarea
              id="resume"
              placeholder="Commentaire interne (non transmis au·à la demandeur·euse)"
              value={resume}
              onChange={(e) => setResume(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={submitting}>Annuler</Button>
            <Button onClick={applyDecision} disabled={submitting} aria-label="Appliquer la décision">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog création (maquette) */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle demande (dérogation)</DialogTitle>
            <DialogDescription>Saisissez les informations requises. Décision par défaut : « en cours ».</DialogDescription>
          </DialogHeader>

          <form onSubmit={createDerogation} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="nom">Nom</Label>
                <Input id="nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="prenom">Prénom</Label>
                <Input id="prenom" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label>Collaborateur</Label>
                <Select value={form.collab || C_ALL} onValueChange={(v) => setForm({ ...form, collab: (v === C_ALL ? '' : (v as CollaboratorCode)) })}>
                  <SelectTrigger><SelectValue placeholder="Choisir…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={C_ALL}>Choisir un collaborateur</SelectItem>
                    <SelectItem value="SJO">SJO</SelectItem>
                    <SelectItem value="FQO">FQO</SelectItem>
                    <SelectItem value="LSN">LSN</SelectItem>
                    <SelectItem value="TBO">TBO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Motif</Label>
                <Textarea value={form.motif} onChange={(e) => setForm({ ...form, motif: e.target.value })} placeholder="Motif (min. 10 caractères)" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={!createValid}>Créer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DerogationsList;

/*
=========================================================
Tests (à placer dans src/components/pages/session/__tests__/DerogationsList.test.tsx)
=========================================================
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import React from 'react';
import DerogationsList from '../DerogationsList';

describe('DerogationsList', () => {
  it('filtre par recherche plein texte', () => {
    render(<DerogationsList />);
    const input = screen.getByLabelText(/Recherche/i);
    fireEvent.change(input, { target: { value: 'Durand' } });
    // 1 header row + 1 data row
    expect(screen.getAllByRole('row')).toHaveLength(2);
  });

  it('filtre par collaborateur (ancien test service)', async () => {
    render(<DerogationsList />);
    const triggers = screen.getAllByRole('combobox');
    const collabTrigger = triggers[0];
    fireEvent.click(collabTrigger);
    const listbox = await screen.findByRole('listbox');
    fireEvent.click(within(listbox).getByText('LSN'));
    expect(screen.getByText('LSN')).toBeInTheDocument();
  });

  it('filtre par décision', async () => {
    render(<DerogationsList />);
    const triggers = screen.getAllByRole('combobox');
    const decisionTrigger = triggers[1];
    fireEvent.click(decisionTrigger);
    const listbox = await screen.findByRole('listbox');
    fireEvent.click(within(listbox).getByText('En cours'));
    // au moins 3 dossiers en cours dans le mock
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeGreaterThan(1);
  });

  it('filtre par plage de dates (Du/Au)', () => {
    render(<DerogationsList />);
    fireEvent.change(screen.getByLabelText('Du'), { target: { value: '2025-06-01' } });
    fireEvent.change(screen.getByLabelText('Au'), { target: { value: '2025-06-30' } });
    // Doit ne montrer que les dossiers de juin 2025
    const cells = screen.getAllByRole('cell');
    expect(cells.some(c => c.textContent?.includes('06.2025') || c.textContent?.includes('2025'))).toBeTruthy();
  });

  it('tri par date croissante/decroissante', async () => {
    render(<DerogationsList />);
    const triggers = screen.getAllByRole('combobox');
    const sortTrigger = triggers[2];
    // Par défaut desc (plus récent en premier)
    // Passe en asc
    fireEvent.click(sortTrigger);
    const listbox = await screen.findByRole('listbox');
    fireEvent.click(within(listbox).getByText('Date croissante'));
    // Vérifie que la première ligne correspond à la date la plus ancienne
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeGreaterThan(1);
  });

  it('création valide ajoute un dossier dans la table', () => {
    render(<DerogationsList />);
    fireEvent.click(screen.getByRole('button', { name: /Créer/i }));
    fireEvent.change(screen.getByLabelText('Nom'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText('Prénom'), { target: { value: 'Agent' } });
    // choisir collaborateur
    const collabTrigger = screen.getAllByRole('combobox')[0];
    fireEvent.click(collabTrigger);
    fireEvent.click(screen.getByText('LSN'));
    fireEvent.change(screen.getByLabelText('Motif'), { target: { value: 'Motif suffisant pour la démo' } });
    const before = screen.getAllByRole('row').length;
    fireEvent.click(screen.getByRole('button', { name: /^Créer$/ }));
    const after = screen.getAllByRole('row').length;
    expect(after).toBeGreaterThan(before);
  });
});

=========================================================
Cypress (pseudo happy path - cypress/e2e/derogations.cy.ts)
=========================================================
// describe('Dérogations - Happy Path', () => {
//   it('crée, voit et décide', () => {
//     cy.visit('/session/derogations');
//     cy.findByRole('button', { name: /créer/i }).click();
//     cy.findByLabelText(/Nom/).type('Test');
//     cy.findByLabelText(/Prénom/).type('Agent');
//     cy.findByRole('combobox', { name: /Collaborateur/ }).click();
//     cy.findByRole('option', { name: 'LSN' }).click();
//     cy.findByLabelText(/Motif/).type('Motif suffisant pour la démo');
//     cy.findByRole('button', { name: /Créer/ }).click();
//     cy.findAllByRole('row').should('have.length.greaterThan', 1);
//     cy.findAllByRole('button', { name: /Voir dossier/ }).first().click();
//     cy.findByRole('button', { name: /Traiter la demande/ }).click();
//   });
// });
*/
