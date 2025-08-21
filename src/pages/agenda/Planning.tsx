import React, { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Phone,
  Building,
  MailPlus,
  Laptop,
  Sun,
  Moon,
  AlertTriangle,
  Download,
  Printer,
  Check,
  Copy,
  Plus,
  Brush,
} from 'lucide-react';

/**
 * Planning — LLM Planner (desktop-first)
 * Adaptation pour src/pages/agenda/Planning.tsx
 * - Compatible avec AgendaPage + Router
 * - Drag & Drop, suppression hors case, re-drag
 * - Mode Pinceau (double-clic sur un agent)
 * - Copier semaine précédente / Ajouter rubrique / Export JSON / Imprimer
 * - Absences (alerte jaune) / Conflits (alerte rouge)
 */

// ---------------------
// Modèle de données
// ---------------------
type PeriodKey = 'AM' | 'PM' | null;
const PERIODS: Record<Exclude<PeriodKey, null>, string> = { AM: 'Matin', PM: 'Après-midi' };

type Role = {
  id: string;
  label: string;
  short: string;
  period: PeriodKey;
  icon: React.ComponentType<{ className?: string }>;
};

type Agent = { id: string; name: string; color: string; tags: string[] };

type Absence = { agentId: string; from: string; to: string; label?: string };

const DEFAULT_ROLES: readonly Role[] = [
  { id: 'reclog_am', label: 'Réception / Mails log.', short: 'Récep/Mails', period: 'AM', icon: Building },
  { id: 'reclog_pm', label: 'Réception / Mails log.', short: 'Récep/Mails', period: 'PM', icon: Building },
  { id: 'mailspart_am', label: 'Mails partenaires', short: 'Mails Part.', period: 'AM', icon: MailPlus },
  { id: 'mailspart_pm', label: 'Mails partenaires', short: 'Mails Part.', period: 'PM', icon: MailPlus },
  { id: 'permtel_am', label: 'Perm. Tél. (08h00)', short: 'Perm. Tél.', period: 'AM', icon: Phone },
  { id: 'horstel_am', label: 'Hors tél.', short: 'Hors tél.', period: 'AM', icon: Phone },
  { id: 'tad', label: 'TAD', short: 'TAD', period: null, icon: Laptop },
] as const;

const AGENTS: readonly Agent[] = [
  { id: 'LSN', name: 'Lison N.', color: '#60a5fa', tags: ['accueil', 'mails'] },
  { id: 'TBO', name: 'Thibault O.', color: '#34d399', tags: ['accueil', 'tel'] },
  { id: 'DBO', name: 'Dorian B.', color: '#facc15', tags: ['mails', 'partenaires'] },
  { id: 'SJO', name: 'Sofia J.', color: '#f87171', tags: ['tel', 'accueil'] },
  { id: 'FQO', name: 'Fouad Q.', color: '#fb923c', tags: ['mails', 'partenaires'] },
  { id: 'SFE', name: 'Safia E.', color: '#a78bfa', tags: ['tad', 'mails'] },
] as const;

const ABSENCES: readonly Absence[] = [
  { agentId: 'FQO', from: '2025-08-05', to: '2025-08-08', label: 'Vacances' },
  { agentId: 'SJO', from: '2025-08-04', to: '2025-08-04', label: 'Vacances' },
  { agentId: 'LSN', from: '2025-08-11', to: '2025-08-24', label: 'Vacances' },
  { agentId: 'SFE', from: '2025-08-04', to: '2025-08-15', label: 'Vacances' },
] as const;

// ---------------------
// Utilitaires date
// ---------------------
function startOfWeek(d: Date) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay(); // 0 = dim
  const diff = (day === 0 ? -6 : 1) - day; // aller au lundi
  date.setUTCDate(date.getUTCDate() + diff);
  return date;
}
function addDays(d: Date, n: number) {
  const dd = new Date(d);
  dd.setUTCDate(dd.getUTCDate() + n);
  return dd;
}
function fmtISO(d: Date) { return d.toISOString().slice(0, 10); }
function fmtFR(d: Date) {
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: '2-digit' });
}

// ---------------------
// UI helpers
// ---------------------
function textColorFor(bg: string) {
  const c = bg.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16), g = parseInt(c.substring(2, 4), 16), b = parseInt(c.substring(4, 6), 16);
  const l = (0.2126 * r + 0.7152 * g + 0.0722 * b);
  return l > 160 ? 'text-gray-900' : 'text-white';
}

function Chip({ color, children, className = '' }: { color: string; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-10 h-8 rounded-xl text-sm font-bold shadow-sm ${className}`}
      style={{ backgroundColor: color }}
    >
      <span className={textColorFor(color)}>{children}</span>
    </span>
  );
}

function CoverageBadge({ missing }: { missing: number }) {
  const ok = missing === 0;
  return (
    <div
      className={`px-3 py-2 rounded-xl inline-flex items-center gap-2 ${
        ok
          ? 'bg-green-50 text-green-700 border border-green-200'
          : 'bg-amber-50 text-amber-700 border border-amber-200'
      }`}
    >
      {ok ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
      <span className="text-sm">{ok ? 'Couverture complète' : `${missing} créneau(x) à couvrir`}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-3 rounded-2xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 shadow-sm">
      <div className="mb-2 text-xs uppercase tracking-wider text-gray-500">{title}</div>
      {children}
    </div>
  );
}

// ---------------------
// Composant principal
// ---------------------
export default function Planning() {
  // démo: date fixe pour un rendu stable
  const today = new Date('2025-08-11T12:00:00Z');
  const [weekStart, setWeekStart] = useState<Date>(startOfWeek(today));
  const [dark, setDark] = useState(false);
  const [assignments, setAssignments] = useState<Record<string, string | undefined>>({}); // key → agentId
  const [filter, setFilter] = useState('');
  const [tagFilter, setTagFilter] = useState<string>('');
  const [roles, setRoles] = useState<Role[]>([...DEFAULT_ROLES]);

  // Mode pinceau : double-clic sur initiales d’un agent
  const [brushAgent, setBrushAgent] = useState<string | undefined>(undefined);

  // DnD state
  const dropHandledRef = useRef(false);
  const dragSourceRef = useRef<null | { fromKey?: string; agentId: string }>(null);

  const days = useMemo(() => [0, 1, 2, 3, 4].map((i) => addDays(weekStart, i)), [weekStart]);

  function key(dayISO: string, roleId: string) {
    return `${dayISO}__${roleId}`;
  }

  function isAbsent(agentId: string, dayISO: string) {
    const d = new Date(dayISO);
    return ABSENCES.some((a) => a.agentId === agentId && new Date(a.from) <= d && d <= new Date(a.to));
  }

  // Conflits : même agent sur 2 rôles d’un même jour+période
  const conflicts = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const d of days) {
      const dayISO = fmtISO(d);
      const perBuckets: Record<'AM' | 'PM', string[]> = { AM: [], PM: [] };
      for (const role of roles) {
        if (!role.period) continue;
        const a = assignments[key(dayISO, role.id)];
        if (a) perBuckets[role.period as 'AM' | 'PM'].push(a);
      }
      (['AM', 'PM'] as const).forEach((p) => {
        const dup = perBuckets[p].filter((v, i, arr) => arr.indexOf(v) !== i);
        if (dup.length) map[`${dayISO}_${p}`] = dup;
      });
    }
    return map;
  }, [assignments, days, roles]);

  const coverage = useMemo(() => {
    let missing = 0;
    for (const d of days) {
      const dayISO = fmtISO(d);
      for (const role of roles) {
        if (role.id === 'tad') continue;
        const a = assignments[key(dayISO, role.id)];
        if (!a) missing++;
      }
    }
    return { missing };
  }, [assignments, days, roles]);

  function setAgent(dayISO: string, roleId: string, agentId: string | undefined) {
    setAssignments((prev) => ({ ...prev, [key(dayISO, roleId)]: agentId }));
  }

  function clearAssignment(assignmentKey: string) {
    setAssignments((prev) => ({ ...prev, [assignmentKey]: undefined }));
  }

  function handleExport() {
    const payload = { weekStart: fmtISO(weekStart), assignments, roles };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planning_${fmtISO(weekStart)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // --- Copier la semaine précédente
  function copyPreviousWeek() {
    const prevStart = addDays(weekStart, -7);
    const updates: Record<string, string | undefined> = {};
    for (let i = 0; i < 5; i++) {
      const srcDay = fmtISO(addDays(prevStart, i));
      const tgtDay = fmtISO(addDays(weekStart, i));
      for (const r of roles) {
        const val = assignments[`${srcDay}__${r.id}`];
        if (val) {
          updates[`${tgtDay}__${r.id}`] = val;
        }
      }
    }
    setAssignments((prev) => ({ ...prev, ...updates }));
  }

  // --- Ajouter une rubrique (nouvelle colonne)
  function addRubric() {
    const label = window.prompt('Nom de la rubrique (ex. Accueil secondaire) ?');
    if (!label) return;
    const periodRaw = window.prompt('Période ? Tapez AM, PM ou vide pour "toute la journée"') || '';
    const upper = periodRaw.toUpperCase();
    const period: PeriodKey = upper === 'AM' ? 'AM' : upper === 'PM' ? 'PM' : null;
    const id = `${label.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Math.random().toString(36).slice(2, 6)}`;
    setRoles((prev) => [...prev, { id, label, short: label, period, icon: Building }]);
  }

  // DnD helpers
  function onDragStartFromList(e: React.DragEvent, agentId: string) {
    e.dataTransfer.setData('text/plain', agentId);
    dragSourceRef.current = { agentId };
    dropHandledRef.current = false;
  }
  function onDragStartFromCell(e: React.DragEvent, dayISO: string, roleId: string, agentId: string) {
    e.dataTransfer.setData('text/plain', agentId);
    dragSourceRef.current = { agentId, fromKey: key(dayISO, roleId) };
    dropHandledRef.current = false;
  }
  function onDropAssign(e: React.DragEvent, dayISO: string, roleId: string) {
    e.preventDefault();
    const agentId = e.dataTransfer.getData('text/plain');
    if (agentId) {
      setAgent(dayISO, roleId, agentId);
      // si le drag venait d’une autre case, effacer la source
      const src = dragSourceRef.current;
      if (src?.fromKey && src.fromKey !== key(dayISO, roleId)) {
        clearAssignment(src.fromKey);
      }
      dropHandledRef.current = true;
    }
  }
  function onDragEnd() {
    const src = dragSourceRef.current;
    // Si on avait pris depuis une cellule et que rien n’a capté le drop => supprimer
    if (src?.fromKey && !dropHandledRef.current) {
      clearAssignment(src.fromKey);
    }
    dragSourceRef.current = null;
  }

  const TAGS = useMemo(() => Array.from(new Set(AGENTS.flatMap((a) => a.tags))), []);

  // Quitter le mode pinceau avec ESC
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setBrushAgent(undefined);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className={`${dark ? 'dark' : ''} w-full h-full font-sans`}>
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 text-gray-900 dark:text-gray-50">
        {/* Header interne (si tu préfères t'appuyer sur AgendaPage seulement, tu peux le retirer) */}
        <header className="sticky top-0 z-10 border-b border-gray-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400" />
              <div className="font-semibold">LLM Planner</div>
              <span className="hidden sm:inline text-sm text-gray-500">Planning d'équipe</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => window.print()} className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-sm inline-flex items-center gap-2"><Printer className="w-4 h-4" />Imprimer</button>
              <button onClick={handleExport} className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-sm inline-flex items-center gap-2"><Download className="w-4 h-4" />Exporter</button>
              <button onClick={() => setDark((v) => !v)} className="px-2 py-2 rounded-xl bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700">{dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}</button>
            </div>
          </div>
        </header>

        {/* Toolbar semaine */}
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekStart(addDays(weekStart, -7))} className="p-2 rounded-xl bg-white dark:bg-neutral-900 shadow border border-gray-200 dark:border-neutral-800" aria-label="Semaine précédente"><ChevronLeft className="w-4 h-4" /></button>
            <div className="px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 shadow border border-gray-200 dark:border-neutral-800 inline-flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              <span className="font-medium">Semaine du {fmtFR(days[0])}</span>
            </div>
            <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="p-2 rounded-xl bg-white dark:bg-neutral-900 shadow border border-gray-200 dark:border-neutral-800" aria-label="Semaine suivante"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <div className="flex items-center gap-2">
            <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filtrer initiales (ex. LSN)" className="px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 shadow border border-gray-200 dark:border-neutral-800 text-sm w-56" />
            <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} className="px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 shadow border border-gray-200 dark:border-neutral-800 text-sm">
              <option value="">Tous les tags</option>
              {TAGS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <CoverageBadge missing={coverage.missing} />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={copyPreviousWeek} className="px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 shadow border border-gray-200 dark:border-neutral-800 text-sm inline-flex items-center gap-2"><Copy className="w-4 h-4" />Copier semaine précédente</button>
            <button onClick={addRubric} className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm inline-flex items-center gap-2"><Plus className="w-4 h-4" />Ajouter une rubrique</button>
            {brushAgent && (
              <div className="px-3 py-2 rounded-xl bg-violet-100 text-violet-900 border border-violet-200 inline-flex items-center gap-2">
                <Brush className="w-4 h-4" /> Pinceau : {brushAgent}
                <button onClick={() => setBrushAgent(undefined)} className="ml-2 px-2 py-0.5 rounded-lg bg-white/70">Quitter (ESC)</button>
              </div>
            )}
          </div>
        </div>

        {/* Layout principal */}
        <div className="max-w-7xl mx-auto px-4 pb-8 grid grid-cols-12 gap-4">
          {/* Sidebar gauche */}
          <aside className="col-span-3 xl:col-span-2 space-y-3">
            <Section title="Collaborateurs (glisser / double-clic = pinceau)">
              <div className="grid grid-cols-3 gap-2">
                {AGENTS.filter((a) => a.id.toLowerCase().includes(filter.toLowerCase()))
                  .filter((a) => (tagFilter ? a.tags.includes(tagFilter) : true))
                  .map((a) => (
                    <div
                      key={a.id}
                      draggable
                      onDragStart={(e) => onDragStartFromList(e, a.id)}
                      onDoubleClick={() => setBrushAgent(a.id)}
                      className="cursor-grab active:cursor-grabbing flex items-center justify-center px-2 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800"
                      title={`Tags: ${a.tags.join(', ')}`}
                    >
                      <Chip color={a.color}>{a.id}</Chip>
                    </div>
                  ))}
              </div>
              <div className="mt-2 text-xs text-gray-500">Glissez les initiales vers une cellule, ou double‑cliquez pour peindre plusieurs cellules avec le même agent.</div>
            </Section>
            <Section title="Absences">
              <div className="space-y-2 text-sm">
                {ABSENCES.map((a, i) => (
                  <div key={i} className="px-2 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 flex items-center justify-between">
                    <Chip color={AGENTS.find((x) => x.id === a.agentId)?.color || '#ddd'}>{a.agentId}</Chip>
                    <span className="text-xs text-gray-500 ml-2">{a.from} → {a.to}</span>
                  </div>
                ))}
              </div>
            </Section>
          </aside>

          {/* Grille planning */}
          <main className="col-span-9 xl:col-span-10">
            <div className="overflow-auto rounded-2xl border border-gray-200 dark:border-neutral-800 shadow bg-white dark:bg-neutral-900">
              <table className="min-w-full border-separate border-spacing-0">
                <thead className="sticky top-0 z-10 bg-white dark:bg-neutral-900">
                  <tr>
                    <th className="sticky left-0 z-20 bg-white dark:bg-neutral-900 px-3 py-2 text-left text-xs uppercase tracking-wider border-b border-gray-200 dark:border-neutral-800">Jours</th>
                    {roles.map((r) => (
                      <th key={r.id} className="px-3 py-2 text-left text-xs uppercase tracking-wider border-b border-gray-200 dark:border-neutral-800">
                        <div className="flex items-center gap-2">
                          <r.icon className="w-4 h-4" />
                          <span>
                            {r.short}
                            {r.period ? ` • ${PERIODS[r.period]}` : ''}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {days.map((d) => {
                    const dayISO = fmtISO(d);
                    return (
                      <tr key={dayISO} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50">
                        <td className="sticky left-0 z-10 bg-white dark:bg-neutral-900 border-b border-gray-100 dark:border-neutral-800 px-3 py-3">
                          <div className="font-medium">{fmtFR(d)}</div>
                        </td>
                        {roles.map((r) => {
                          const k = key(dayISO, r.id);
                          const agentId = assignments[k];
                          const agent = AGENTS.find((a) => a.id === agentId);
                          const period = r.period as Exclude<PeriodKey, null> | null;
                          const absent = !!agentId && isAbsent(agentId, dayISO);
                          const conflictKey = period ? `${dayISO}_${period}` : '';
                          const isConflict = period ? (conflicts[conflictKey]?.includes(agentId as string) || false) : false;

                          return (
                            <td key={r.id} className="border-b border-gray-100 dark:border-neutral-800 px-3 py-2 align-top min-w-[140px]">
                              <button
                                onClick={() => (brushAgent ? setAgent(dayISO, r.id, brushAgent) : undefined)}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => onDropAssign(e, dayISO, r.id)}
                                className={`w-full h-12 rounded-xl border text-left px-2 flex items-center justify-between gap-2 transition ${
                                  agent ? 'bg-white dark:bg-neutral-950' : 'bg-gray-50 dark:bg-neutral-800/40'
                                } border-gray-200 dark:border-neutral-800 hover:border-gray-300 dark:hover:border-neutral-700`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  {agent ? (
                                    <div
                                      draggable
                                      onDragStart={(e) => onDragStartFromCell(e, dayISO, r.id, agent.id)}
                                      onDragEnd={onDragEnd}
                                      className="cursor-grab active:cursor-grabbing"
                                    >
                                      <Chip color={agent.color}>{agent.id}</Chip>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-gray-400">Déposer ici…</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  {absent && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                                  {isConflict && <AlertTriangle className="w-4 h-4 text-red-500" />}
                                </div>
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export { Planning };
