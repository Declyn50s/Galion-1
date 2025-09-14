// src/pages/tasks/TasksPage.tsx
import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  List as ListIcon,
  KanbanSquare,
  Search,
  Filter,
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock3,
  User,
  Tags,
  Paperclip,
  Link as LinkIcon,
  Trash2,
  Edit3,
} from "lucide-react";

/* -------------------------------------------------------
   Page "Tâches" (Liste + Kanban)
   - Données mock
   - Filtres / recherche / DnD
------------------------------------------------------- */

const currentUser = "Derval"; // TODO: remplace par l'utilisateur connecté

const TYPE_LABELS = {
  inscription: "Inscription",
  renouvellement: "Renouvellement",
  controle: "Contrôle",
  maj: "Mise à jour",
  miseConformite: "Mise en conformité",
  calculLimite: "Calcul de limite",
  resiliation: "Résiliation",
  convocation: "Convocation",
  attestation: "Attestation",
  bail: "Bail à passer",
  ouverture: "Ouverture logement",
  publication: "Publication",
} as const;

const STATUS_ORDER = ["A faire", "En cours", "Terminé"] as const;
type Status = typeof STATUS_ORDER[number];

type Task = {
  id: string;
  title: string;
  type: keyof typeof TYPE_LABELS | string;
  priority: "Urgent" | "Normal" | "Info" | string;
  status: Status | string;
  assignee: string;
  dueDate: string; // ISO
  source: string;
  ref: string;
  tags: string[];
};

const PRIORITY_COLORS: Record<string, string> = {
  Urgent: "bg-red-100 text-red-700 border-red-200",
  Normal: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Info: "bg-slate-100 text-slate-700 border-slate-200",
};

const TYPE_COLORS: Record<string, string> = {
  inscription: "bg-indigo-50 text-indigo-700 border-indigo-200",
  renouvellement: "bg-violet-50 text-violet-700 border-violet-200",
  controle: "bg-amber-50 text-amber-800 border-amber-200",
  maj: "bg-blue-50 text-blue-700 border-blue-200",
  miseConformite: "bg-rose-50 text-rose-700 border-rose-200",
  calculLimite: "bg-cyan-50 text-cyan-700 border-cyan-200",
  resiliation: "bg-red-50 text-red-700 border-red-200",
  convocation: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
  attestation: "bg-emerald-50 text-emerald-700 border-emerald-200",
  bail: "bg-sky-50 text-sky-700 border-sky-200",
  ouverture: "bg-lime-50 text-lime-700 border-lime-200",
  publication: "bg-teal-50 text-teal-700 border-teal-200",
};

function seedTasks(): Task[] {
  const today = new Date();
  const d = (offset: number) => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() + offset);
    return dt.toISOString();
  };
  return [
    {
      id: "T-001",
      title: "Vérifier dossier d'inscription — Martin Dupont",
      type: "inscription",
      priority: "Urgent",
      status: "A faire",
      assignee: "Derval",
      dueDate: d(0),
      source: "Journal",
      ref: "JRN-2025-0012",
      tags: ["Pièce manquante", "CNI"],
    },
    {
      id: "T-002",
      title: "Renouvellement — Famille Rossi (LLM #A-12)",
      type: "renouvellement",
      priority: "Normal",
      status: "En cours",
      assignee: "Nadia",
      dueDate: d(3),
      source: "Journal",
      ref: "JRN-2025-0041",
      tags: ["Revenus", "Justificatifs"],
    },
    {
      id: "T-003",
      title: "Contrôle situation — Ahmed K.",
      type: "controle",
      priority: "Info",
      status: "A faire",
      assignee: "Marc",
      dueDate: d(7),
      source: "Journal",
      ref: "JRN-2025-0063",
      tags: ["Contrôle annuel"],
    },
    {
      id: "T-004",
      title: "Mise à jour dossier — Complément justificatifs",
      type: "maj",
      priority: "Normal",
      status: "A faire",
      assignee: "Derval",
      dueDate: d(2),
      source: "Journal",
      ref: "JRN-2025-0090",
      tags: ["RIB", "B3"],
    },
    {
      id: "T-005",
      title: "Mise en conformité — Proposition gérance Dupuy",
      type: "miseConformite",
      priority: "Urgent",
      status: "En cours",
      assignee: "Sophie",
      dueDate: d(-1),
      source: "Gérance",
      ref: "GER-2025-022",
      tags: ["Contrat", "Annexe"],
    },
    {
      id: "T-006",
      title: "Calculer limite d'occupation — Dossier #7843",
      type: "calculLimite",
      priority: "Info",
      status: "A faire",
      assignee: "Nadia",
      dueDate: d(10),
      source: "Logement",
      ref: "LOG-7843",
      tags: ["Surface", "Composition"],
    },
    {
      id: "T-007",
      title: "Résiliation — Locataire P. Bernard",
      type: "resiliation",
      priority: "Urgent",
      status: "A faire",
      assignee: "Marc",
      dueDate: d(1),
      source: "Baux",
      ref: "BAX-3302",
      tags: ["Préavis"],
    },
    {
      id: "T-008",
      title: "Convocation commission — Dossier #5621",
      type: "convocation",
      priority: "Normal",
      status: "En cours",
      assignee: "Sophie",
      dueDate: d(5),
      source: "Agenda",
      ref: "COM-5621",
      tags: ["Commission", "Séance"],
    },
    {
      id: "T-009",
      title: "Émettre attestation — Mme Lopez",
      type: "attestation",
      priority: "Info",
      status: "Terminé",
      assignee: "Derval",
      dueDate: d(-2),
      source: "Journal",
      ref: "JRN-2025-0102",
      tags: ["Envoyée"],
    },
    {
      id: "T-010",
      title: "Bail à passer — LLM #B-07",
      type: "bail",
      priority: "Normal",
      status: "A faire",
      assignee: "Nadia",
      dueDate: d(4),
      source: "Baux",
      ref: "BAX-3388",
      tags: ["Signature"],
    },
    {
      id: "T-011",
      title: "Ouverture logement libre — Immeuble Parc 3",
      type: "ouverture",
      priority: "Info",
      status: "A faire",
      assignee: "Marc",
      dueDate: d(6),
      source: "Logement",
      ref: "LOG-OPEN-03",
      tags: ["État des lieux"],
    },
    {
      id: "T-012",
      title: "Publication sur listes — LLM #C-21",
      type: "publication",
      priority: "Normal",
      status: "En cours",
      assignee: "Sophie",
      dueDate: d(1),
      source: "Logement",
      ref: "PUB-C21",
      tags: ["Diffusion"],
    },
  ];
}

function classNames(...cls: (string | false | undefined)[]) {
  return cls.filter(Boolean).join(" ");
}
function isOverdue(dateIso: string) {
  const d = new Date(dateIso);
  const now = new Date();
  const dOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return dOnly < nowOnly;
}
function withinDays(dateIso: string, days: number) {
  const d = new Date(dateIso).getTime();
  const now = new Date().getTime();
  return d - now <= days * 24 * 3600 * 1000 && d - now >= 0;
}
function formatDate(dateIso: string) {
  const d = new Date(dateIso);
  return d.toLocaleDateString("fr-CH", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Helpers DnD
function isValidStatus(s: string): s is Status {
  return (STATUS_ORDER as readonly string[]).includes(s);
}
function moveTaskStatus(list: Task[], id: string, newStatus: string): Task[] {
  if (!isValidStatus(newStatus)) return list.slice();
  return list.map((t) => (t.id === id ? { ...t, status: newStatus as Status } : t));
}

// Auto-tests console
function runSelfTests() {
  const seeds = seedTasks();
  const typeKeys = new Set(Object.keys(TYPE_LABELS));
  const statusSet = new Set(STATUS_ORDER as readonly string[]);

  const tests = [
    { name: "Types présents", pass: seeds.every((t) => typeKeys.has(t.type)) },
    { name: "Statuts présents", pass: seeds.every((t) => statusSet.has(t.status as string)) },
    {
      name: "moveTaskStatus valide",
      pass: (() => {
        const before = seedTasks();
        const id = before[0].id;
        const after = moveTaskStatus(before, id, "En cours");
        return after.find((t) => t.id === id)?.status === "En cours";
      })(),
    },
    {
      name: "moveTaskStatus invalide ignoré",
      pass: (() => {
        const before = seedTasks();
        const id = before[1].id;
        const prev = before.find((t) => t.id === id)!.status;
        const after = moveTaskStatus(before, id, "Inconnu");
        return after.find((t) => t.id === id)!.status === prev;
      })(),
    },
  ];
  tests.forEach((t) => console[t.pass ? "log" : "error"](`TEST — ${t.name} : ${t.pass ? "OK" : "FAIL"}`));
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(() => seedTasks());
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"liste" | "kanban">("liste");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<Status | null>(null);

  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState<string[]>([]);
  const [prioFilter, setPrioFilter] = useState<string[]>([]);
  const [dueQuick, setDueQuick] = useState<string | null>(null);

  useEffect(() => {
    runSelfTests();
  }, []);

  const assignees = useMemo(() => Array.from(new Set(tasks.map((t) => t.assignee))), [tasks]);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      const q = query.trim().toLowerCase();
      const matchQ =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.ref.toLowerCase().includes(q) ||
        TYPE_LABELS[(t.type as keyof typeof TYPE_LABELS) || "" as any]?.toLowerCase?.().includes?.(q) ||
        t.assignee.toLowerCase().includes(q);

      const matchStatus = statusFilter.length === 0 || statusFilter.includes(t.status as string);
      const matchType = typeFilter.length === 0 || typeFilter.includes(t.type as string);
      const matchAssignee = assigneeFilter.length === 0 || assigneeFilter.includes(t.assignee);
      const matchPrio = prioFilter.length === 0 || prioFilter.includes(t.priority as string);

      let matchDue = true;
      if (dueQuick === "aujourd\u2019hui") {
        const d = new Date(t.dueDate);
        const n = new Date();
        matchDue = d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
      } else if (dueQuick === "semaine") {
        matchDue = withinDays(t.dueDate, 7);
      } else if (dueQuick === "enRetard") {
        matchDue = isOverdue(t.dueDate);
      }

      return matchQ && matchStatus && matchType && matchAssignee && matchPrio && matchDue;
    });
  }, [tasks, query, statusFilter, typeFilter, assigneeFilter, prioFilter, dueQuick]);

  const kpis = useMemo(() => {
    const mine = tasks.filter((t) => t.assignee === currentUser && t.status !== "Terminé").length;
    const overdue = tasks.filter((t) => t.status !== "Terminé" && isOverdue(t.dueDate)).length;
    const today =
      tasks.filter(
        (t) => t.status !== "Terminé" && new Date(t.dueDate).toDateString() === new Date().toDateString()
      ).length;
    const urgent = tasks.filter((t) => t.status !== "Terminé" && t.priority === "Urgent").length;
    return { mine, overdue, today, urgent };
  }, [tasks]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  function toggleFilter(setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) {
    setter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  }
  function bulkComplete() {
    setTasks((ts) => ts.map((t) => (selectedIds.includes(t.id) ? { ...t, status: "Terminé" } : t)));
    setSelectedIds([]);
  }
  function cycleStatus(id: string) {
    setTasks((ts) =>
      ts.map((t) => {
        if (t.id !== id) return t;
        const idx = STATUS_ORDER.indexOf(t.status as Status);
        const next = STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
        return { ...t, status: next };
      })
    );
  }
  function createTask() {
    const nid = "T-" + String(Math.floor(Math.random() * 9000) + 1000);
    const newTask: Task = {
      id: nid,
      title: "Nouvelle tâche",
      type: "maj",
      priority: "Info",
      status: "A faire",
      assignee: currentUser,
      dueDate: new Date().toISOString(),
      source: "Journal",
      ref: "NEW-" + nid,
      tags: ["Brouillon"],
    };
    setTasks((ts) => [newTask, ...ts]);
  }

  const columns = useMemo(
    () =>
      STATUS_ORDER.map((st) => ({
        key: st as Status,
        items: filtered.filter((t) => t.status === st),
      })),
    [filtered]
  );

  const selectedTask = tasks.find((t) => t.id === detailId) || null;

  // DnD
  function onCardDragStart(e: React.DragEvent, id: string) {
    e.dataTransfer.setData("text/task-id", id);
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(id);
  }
  function onCardDragEnd() {
    setDraggingId(null);
    setDragOverCol(null);
  }
  function onColDragOver(e: React.DragEvent, col: Status) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(col);
  }
  function onColDrop(e: React.DragEvent, col: Status) {
    const id = e.dataTransfer.getData("text/task-id");
    if (!id) return;
    setTasks((ts) => moveTaskStatus(ts, id, col));
    setDraggingId(null);
    setDragOverCol(null);
  }

  return (
    <div className="h-full w-full bg-slate-50 text-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-[1400px] px-6 py-4 flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Tâches</h1>

          <div className="ml-6 hidden lg:flex gap-2">
            <Kpi label="Mes tâches" value={kpis.mine} icon={<User className="h-4 w-4" />} />
            <Kpi label="En retard" value={kpis.overdue} icon={<AlertTriangle className="h-4 w-4" />} variant="danger" />
            <Kpi label="Aujourd'hui" value={kpis.today} icon={<Calendar className="h-4 w-4" />} />
            <Kpi label="Urgentes" value={kpis.urgent} icon={<Clock3 className="h-4 w-4" />} />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher (titre, ref, agent...)"
                className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 w-72"
              />
            </div>

            <button
              onClick={() => setFiltersOpen((v) => !v)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
            >
              <Filter className="h-4 w-4" />
              Filtres
            </button>

            <ViewToggle view={view} setView={setView} />

            <button
              onClick={createTask}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 rounded-2xl shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Nouvelle tâche
            </button>
          </div>
        </div>

        {/* Panneau filtres */}
        <AnimatePresence>
          {filtersOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-slate-200 bg-white"
            >
              <div className="mx-auto max-w-[1400px] px-6 py-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                <FilterBox title="Statut">
                  {STATUS_ORDER.map((st) => (
                    <Chip key={st} active={statusFilter.includes(st)} onClick={() => toggleFilter(setStatusFilter, st)}>
                      {st}
                    </Chip>
                  ))}
                </FilterBox>

                <FilterBox title="Type">
                  {Object.keys(TYPE_LABELS).map((tp) => (
                    <Chip key={tp} active={typeFilter.includes(tp)} onClick={() => toggleFilter(setTypeFilter, tp)}>
                      {TYPE_LABELS[tp as keyof typeof TYPE_LABELS]}
                    </Chip>
                  ))}
                </FilterBox>

                <FilterBox title="Collaborateur">
                  {assignees.map((a) => (
                    <Chip key={a} active={!!assigneeFilter.includes(a)} onClick={() => toggleFilter(setAssigneeFilter, a)}>
                      {a}
                    </Chip>
                  ))}
                </FilterBox>

                <FilterBox title="Priorité">
                  {["Urgent", "Normal", "Info"].map((p) => (
                    <Chip key={p} active={prioFilter.includes(p)} onClick={() => toggleFilter(setPrioFilter, p)}>
                      {p}
                    </Chip>
                  ))}
                </FilterBox>

                <FilterBox title="Échéance rapide">
                  {[
                    { key: "aujourd\u2019hui", label: "Aujourd'hui" },
                    { key: "semaine", label: "Cette semaine" },
                    { key: "enRetard", label: "En retard" },
                  ].map((opt) => (
                    <Chip
                      key={opt.key}
                      active={dueQuick === opt.key}
                      onClick={() => setDueQuick(dueQuick === opt.key ? null : (opt.key as any))}
                    >
                      {opt.label}
                    </Chip>
                  ))}
                </FilterBox>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Barre actions groupées */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
          >
            <div className="flex items-center gap-3 bg-white border border-slate-200 shadow-xl rounded-2xl px-4 py-2">
              <span className="text-sm text-slate-600">{selectedIds.length} sélectionnée(s)</span>
              <button
                onClick={bulkComplete}
                className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <CheckCircle2 className="h-4 w-4" /> Marquer terminé
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="text-sm px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50"
              >
                Annuler
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contenu */}
      <div className="mx-auto max-w-[1400px] p-6">
        {view === "liste" ? (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="grid grid-cols-[40px_1.5fr_1fr_1fr_1fr_100px] gap-0 px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <div className="flex items-center justify-center">
                <input
                  type="checkbox"
                  aria-label="Tout sélectionner"
                  onChange={(e) => setSelectedIds(e.target.checked ? filtered.map((t) => t.id) : [])}
                  checked={selectedIds.length > 0 && selectedIds.length === filtered.length && filtered.length > 0}
                />
              </div>
              <div>Tâche</div>
              <div>Type</div>
              <div>Collaborateur</div>
              <div>Échéance</div>
              <div className="text-right pr-2">Statut</div>
            </div>

            <ul className="divide-y divide-slate-100">
              {filtered.map((t) => (
                <li key={t.id} className="grid grid-cols-[40px_1.5fr_1fr_1fr_1fr_100px] px-4 py-3 hover:bg-slate-50">
                  <div className="flex items-center justify-center">
                    <input type="checkbox" checked={selectedIds.includes(t.id)} onChange={() => toggleSelect(t.id)} />
                  </div>

                  <div className="flex items-center gap-3">
                    <button onClick={() => setDetailId(t.id)} className="text-left">
                      <div className="font-medium text-slate-900 flex items-center gap-2">
                        {t.priority === "Urgent" && <AlertTriangle className="h-4 w-4 text-red-500" aria-hidden />}
                        {t.title}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1">
                          <LinkIcon className="h-3 w-3" /> {t.ref}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Tags className="h-3 w-3" /> {t.tags.join(", ")}
                        </span>
                      </div>
                    </button>
                  </div>

                  <div className="flex items-center">
                    <span
                      className={classNames(
                        "text-xs px-2 py-1 rounded-md border",
                        TYPE_COLORS[t.type as string] || "bg-slate-50 text-slate-700 border-slate-200"
                      )}
                    >
                      {TYPE_LABELS[t.type as keyof typeof TYPE_LABELS] || t.type}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400" /> {t.assignee}
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span
                      className={classNames(
                        "text-sm",
                        isOverdue(t.dueDate) && t.status !== "Terminé" && "text-red-600 font-medium"
                      )}
                    >
                      {formatDate(t.dueDate)}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pr-2">
                    <button
                      onClick={() => cycleStatus(t.id)}
                      className="inline-flex items-center gap-1 text-sm px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-100"
                    >
                      {t.status === "A faire" && <Circle className="h-4 w-4" />}
                      {t.status === "En cours" && <Clock3 className="h-4 w-4" />}
                      {t.status === "Terminé" && <CheckCircle2 className="h-4 w-4" />}
                      {t.status}
                    </button>
                  </div>
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="p-8 text-center text-slate-500">Aucune tâche ne correspond aux filtres.</li>
              )}
            </ul>
          </div>
        ) : (
          // Kanban
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {columns.map((col) => (
              <div
                key={col.key}
                className={classNames(
                  "bg-white border rounded-2xl p-3 transition-shadow",
                  dragOverCol === col.key ? "border-slate-400 shadow-lg" : "border-slate-200"
                )}
                onDragOver={(e) => onColDragOver(e, col.key)}
                onDrop={(e) => onColDrop(e, col.key)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold text-slate-700">
                    {col.key} <span className="text-slate-400 font-normal">({col.items.length})</span>
                  </div>
                </div>
                <div className="space-y-3 min-h-[120px]">
                  {col.items.map((t) => (
                    <motion.div
                      key={t.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={classNames(
                        "rounded-xl border border-slate-200 bg-white shadow-sm p-3 hover:shadow-md cursor-move",
                        draggingId === t.id && "opacity-60"
                      )}
                      draggable
                      onDragStart={(e) => onCardDragStart(e, t.id)}
                      onDragEnd={onCardDragEnd}
                      onClick={() => setDetailId(t.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-slate-900 flex items-center gap-2">
                            {t.priority === "Urgent" && <AlertTriangle className="h-4 w-4 text-red-500" aria-hidden />}
                            {t.title}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                            <span
                              className={classNames(
                                "px-2 py-0.5 rounded-md border",
                                TYPE_COLORS[t.type as string] || "bg-slate-50 text-slate-700 border-slate-200"
                              )}
                            >
                              {TYPE_LABELS[t.type as keyof typeof TYPE_LABELS] || t.type}
                            </span>
                            <span
                              className={classNames(
                                "px-2 py-0.5 rounded-md border",
                                PRIORITY_COLORS[t.priority] || "bg-slate-50 text-slate-700 border-slate-200"
                              )}
                            >
                              {t.priority}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {t.assignee}
                            </span>
                            <span
                              className={classNames(
                                "inline-flex items-center gap-1",
                                isOverdue(t.dueDate) && t.status !== "Terminé" && "text-red-600 font-medium"
                              )}
                            >
                              <Calendar className="h-3 w-3" /> {formatDate(t.dueDate)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {col.items.length === 0 && (
                    <div className="text-center text-xs text-slate-400 py-4 border border-dashed border-slate-200 rounded-xl">
                      Déposer ici
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Détails (drawer) */}
      <AnimatePresence>
        {selectedTask && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/20" onClick={() => setDetailId(null)} />
            <motion.aside
              initial={{ x: 480 }}
              animate={{ x: 0 }}
              exit={{ x: 480 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute right-0 top-0 h-full w-full max-w-xl bg-white border-l border-slate-200 shadow-2xl p-6 overflow-y-auto"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-500">
                    {selectedTask.ref} · {TYPE_LABELS[selectedTask.type as keyof typeof TYPE_LABELS] || selectedTask.type}
                  </div>
                  <h2 className="mt-1 text-xl font-semibold">{selectedTask.title}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span
                      className={classNames(
                        "px-2 py-0.5 rounded-md border",
                        TYPE_COLORS[selectedTask.type as string] || "bg-slate-50 text-slate-700 border-slate-200"
                      )}
                    >
                      {TYPE_LABELS[selectedTask.type as keyof typeof TYPE_LABELS] || selectedTask.type}
                    </span>
                    <span
                      className={classNames(
                        "px-2 py-0.5 rounded-md border",
                        PRIORITY_COLORS[selectedTask.priority] || "bg-slate-50 text-slate-700 border-slate-200"
                      )}
                    >
                      {selectedTask.priority}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <User className="h-3 w-3" /> {selectedTask.assignee}
                    </span>
                    <span
                      className={classNames(
                        "inline-flex items-center gap-1",
                        isOverdue(selectedTask.dueDate) && selectedTask.status !== "Terminé" && "text-red-600 font-medium"
                      )}
                    >
                      <Calendar className="h-3 w-3" /> {formatDate(selectedTask.dueDate)}
                    </span>
                  </div>
                </div>
                <button onClick={() => setDetailId(null)} className="text-slate-500 hover:text-slate-700">
                  Fermer
                </button>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4">
                <section className="border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Actions rapides</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => cycleStatus(selectedTask.id)}
                        className="inline-flex items-center gap-1 text-sm px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-50"
                      >
                        {selectedTask.status === "A faire" && <Circle className="h-4 w-4" />}
                        {selectedTask.status === "En cours" && <Clock3 className="h-4 w-4" />}
                        {selectedTask.status === "Terminé" && <CheckCircle2 className="h-4 w-4" />}
                        {selectedTask.status}
                      </button>
                      <button className="inline-flex items-center gap-1 text-sm px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-50">
                        <Edit3 className="h-4 w-4" /> Éditer
                      </button>
                      <button className="inline-flex items-center gap-1 text-sm px-2 py-1 rounded-lg border border-slate-200 text-red-600 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" /> Supprimer
                      </button>
                    </div>
                  </div>
                </section>

                <section className="border border-slate-200 rounded-xl p-4">
                  <h3 className="text-sm font-semibold mb-2">Description</h3>
                  <p className="text-sm text-slate-700">
                    Mettre ici les consignes, champs spécifiques (n° logement, usager, gérance, pièces demandées, etc.).
                  </p>
                </section>

                <section className="border border-slate-200 rounded-xl p-4">
                  <h3 className="text-sm font-semibold mb-2">Commentaires</h3>
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="flex gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs">{i}</div>
                        <div>
                          <div className="text-xs text-slate-500">{i === 1 ? "Nadia" : "Marc"} · {i === 1 ? "il y a 2h" : "hier"}</div>
                          <div className="text-sm">
                            {i === 1 ? "Vérifier la pièce d'identité scannée." : "OK pour la commission de vendredi."}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <input
                        placeholder="Ajouter un commentaire…"
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-200"
                      />
                      <button className="inline-flex items-center gap-1 text-sm px-3 py-2 rounded-lg bg-slate-900 text-white">
                        Envoyer
                      </button>
                    </div>
                  </div>
                </section>

                <section className="border border-slate-200 rounded-xl p-4">
                  <h3 className="text-sm font-semibold mb-2">Pièces jointes</h3>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50">
                      <Paperclip className="h-4 w-4" /> Joindre
                    </button>
                    <span className="inline-flex items-center gap-1">
                      <LinkIcon className="h-4 w-4" /> {selectedTask.ref}_PJ1.pdf
                    </span>
                  </div>
                </section>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- petits composants ---------- */
function Kpi({
  label,
  value,
  icon,
  variant,
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
  variant?: "danger" | "default";
}) {
  const tone =
    variant === "danger"
      ? "bg-red-50 text-red-700 border-red-200"
      : "bg-slate-50 text-slate-700 border-slate-200";
  return (
    <div className={classNames("flex items-center gap-2 px-3 py-1.5 rounded-xl border", tone)}>
      {icon}
      <span className="text-xs">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

function ViewToggle({
  view,
  setView,
}: {
  view: "liste" | "kanban";
  setView: (v: "liste" | "kanban") => void;
}) {
  return (
    <div className="inline-flex rounded-2xl border border-slate-200 p-1 bg-white shadow-sm">
      <button
        onClick={() => setView("liste")}
        className={classNames(
          "inline-flex items-center gap-2 px-3 py-2 rounded-xl",
          view === "liste" ? "bg-slate-900 text-white" : "hover:bg-slate-50"
        )}
      >
        <ListIcon className="h-4 w-4" /> Liste
      </button>
      <button
        onClick={() => setView("kanban")}
        className={classNames(
          "inline-flex items-center gap-2 px-3 py-2 rounded-xl",
          view === "kanban" ? "bg-slate-900 text-white" : "hover:bg-slate-50"
        )}
      >
        <KanbanSquare className="h-4 w-4" /> Kanban
      </button>
    </div>
  );
}

function FilterBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium text-slate-500 mb-1">{title}</div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={classNames(
        "text-xs px-2.5 py-1 rounded-lg border",
        active ? "bg-slate-900 text-white border-slate-900" : "bg-white hover:bg-slate-50 border-slate-200"
      )}
    >
      {children}
    </button>
  );
}
