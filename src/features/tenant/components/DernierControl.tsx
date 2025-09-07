// src/features/tenant/components/DernierControl.tsx
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, Stamp, FileWarning, Clock3, ArrowRight, Copy, Layers } from "lucide-react";

import FrequencyBadge from "@/features/tenant/components/Control/FrequencyBadge";
import { LAW_LABELS } from "@/features/tenant/control/config";

// ─────────────────────────────────────────────────────────
// Types
export type LawKind = "LC.75" | "LC.2007" | "RC" | "UNKNOWN";
export type SonKind = "none" | "simple" | "notoire";
export type RteKind = "unknown" | "none" | "lte20" | "gt20";

export type ControlResultMini = {
  son: SonKind;
  rte: RteKind;       // "none" accepté pour compat facilité d'affichage
  dif?: boolean;
};

export type ControlActionsMini = {
  supplement?: { percent: number; startDate?: string; endDate?: string };
  suppressionAides?: { communal?: boolean; cantonale?: boolean; AS?: boolean; startDate?: string; durationMonths?: number };
  resiliation?: { reason?: "SON_SIMPLE"|"SON_NOTOIRE"|"RTE_GT20"|"DIF"|"AUTRE"; noticeDate?: string; leaveDate?: string };
  prolongations?: Array<{ date: string; type?: string }>;
};

export type ControlEntry = {
  id?: string;
  date: string;                  // ISO
  baremeColumn?: number;
  by?: string;
  updatedBy?: string;
  result: ControlResultMini;
  actions?: ControlActionsMini;
  status?: { visa?: string; avisDepotRequete?: string; quitteLe?: string };
  notes?: string;
};

export type DernierControlProps = {
  law: LawKind;
  hasAS?: boolean;

  /** Nouveau format : historique (ordre libre, on trie par date desc). */
  history?: ControlEntry[];

  /** Compat: anciens props “dernier contrôle” (facultatifs). */
  controlDate?: string;
  baremeColumn?: number;
  by?: string;
  updatedBy?: string;
  result?: ControlResultMini;
  actions?: ControlActionsMini;
  status?: { visa?: string; avisDepotRequete?: string; quitteLe?: string };
  notes?: string;

  /** Contrôle en cours (depuis ControlDialog.onRun) qu’on peut appliquer. */
  pending?: ControlEntry | null;

  /** Callbacks */
  onCopyToHistory?: (entry: ControlEntry) => void;
  onOverwriteLast?: (entry: ControlEntry) => void;

  className?: string;
};
// ─────────────────────────────────────────────────────────

const fmtDate = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-CH");
};

const Pill: React.FC<React.PropsWithChildren<{ tone?: "default" | "warn" | "bad" | "muted" }>> = ({ children, tone="default" }) => {
  const toneClass =
    tone === "bad" ? "bg-red-100 text-red-800 border-red-200"
    : tone === "warn" ? "bg-amber-100 text-amber-900 border-amber-200"
    : tone === "muted" ? "bg-slate-100 text-slate-800 border-slate-200"
    : "bg-emerald-100 text-emerald-800 border-emerald-200";
  return <Badge variant="outline" className={`border ${toneClass}`}>{children}</Badge>;
};

function shortResume(e: ControlEntry): string {
  const bits: string[] = [];
  // SON
  if (e.result.son === "notoire") bits.push("SON notoire");
  else if (e.result.son === "simple") bits.push("SON simple");
  // RTE
  if (e.result.rte === "gt20") bits.push("RTE ≥20%");
  else if (e.result.rte === "lte20") bits.push("RTE <20%");
  // DIF
  if (e.result.dif) bits.push("DIF");
  if (bits.length === 0) bits.push("Conforme");
  return bits.join(" · ");
}

function rowTone(e: ControlEntry): "default" | "warn" | "bad" | "muted" {
  if (e.result.son === "notoire" || e.result.rte === "gt20" || e.result.dif) return "bad";
  if (e.result.son === "simple" || e.result.rte === "lte20") return "warn";
  if (e.result.rte === "unknown") return "muted";
  return "default";
}

function normalizeHistory(props: DernierControlProps): ControlEntry[] {
  // Si history fourni, on l’utilise
  if (props.history && props.history.length) {
    return [...props.history].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }
  // Sinon on reconstruit depuis les props unitaires (compat)
  if (props.controlDate || props.result) {
    return [{
      date: props.controlDate || new Date().toISOString().slice(0, 10),
      baremeColumn: props.baremeColumn,
      by: props.by,
      updatedBy: props.updatedBy,
      result: props.result ?? { son: "none", rte: "unknown" },
      actions: props.actions,
      status: props.status,
      notes: props.notes,
    }];
  }
  return [];
}

const ActionsLine: React.FC<{ e: ControlEntry }> = ({ e }) => {
  const a = e.actions;
  const chips: string[] = [];
  if (a?.supplement) chips.push(`Suppl. ${a.supplement.percent}%${a.supplement.startDate ? ` dès ${fmtDate(a.supplement.startDate)}` : ""}`);
  if (a?.suppressionAides) {
    const flags = [
      a.suppressionAides.communal ? "comm." : null,
      a.suppressionAides.cantonale ? "cant." : null,
      a.suppressionAides.AS ? "AS" : null,
    ].filter(Boolean).join("/");
    chips.push(`Suppr. aides ${flags || "—"}${a.suppressionAides.startDate ? ` dès ${fmtDate(a.suppressionAides.startDate)}` : ""}${a.suppressionAides.durationMonths ? ` (${a.suppressionAides.durationMonths} m)` : ""}`);
  }
  if (a?.resiliation) chips.push(`Résil. ${a.resiliation.reason?.replace("_", " ")}${a.resiliation.noticeDate ? ` notif. ${fmtDate(a.resiliation.noticeDate)}` : ""}${a.resiliation.leaveDate ? ` – départ ${fmtDate(a.resiliation.leaveDate)}` : ""}`);
  if (a?.prolongations?.length) chips.push(`${a.prolongations.length} prolong.`);

  return chips.length ? (
    <div className="flex flex-wrap gap-1">
      {chips.map((c, i) => <Badge key={i} variant="outline">{c}</Badge>)}
    </div>
  ) : null;
};

const Line: React.FC<{
  e: ControlEntry;
  isLast?: boolean;
  onCopy?: (e: ControlEntry) => void;
}> = ({ e, isLast, onCopy }) => {
  const tone = rowTone(e);
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="bg-white">
            <CalendarDays className="w-3.5 h-3.5 mr-1" />
            {fmtDate(e.date)}
          </Badge>
          {typeof e.baremeColumn === "number" && (
            <Badge variant="outline">Barème&nbsp;: {e.baremeColumn}</Badge>
          )}
          <Pill tone={tone}>{shortResume(e)}</Pill>
          {e.result.rte === "unknown" && (
            <Badge variant="outline" className="border-amber-200 text-amber-800 bg-amber-50">
              <FileWarning className="w-3.5 h-3.5 mr-1" />
              RTE incomplet
            </Badge>
          )}
        </div>
        <div className="mt-1 text-xs text-slate-600 flex flex-wrap gap-2">
          {e.by && <span><Stamp className="inline w-3.5 h-3.5 mr-1" />Par&nbsp;{e.by}</span>}
          {e.updatedBy && <span>Maj&nbsp;{e.updatedBy}</span>}
          {e.status?.visa && <span>Visa&nbsp;: {e.status.visa}</span>}
          {e.status?.avisDepotRequete && <span>Avis dépôt req.&nbsp;: {e.status.avisDepotRequete}</span>}
          {e.status?.quitteLe && <span>Quitté le&nbsp;{fmtDate(e.status.quitteLe)}</span>}
        </div>
        {e.actions && <div className="mt-1"><ActionsLine e={e} /></div>}
        {e.notes && <div className="mt-1 text-xs text-slate-500 italic">{e.notes}</div>}
      </div>

      <div className="flex-shrink-0 flex gap-1">
        {onCopy && (
          <Button variant="outline" size="sm" className="h-7 px-2 gap-1" onClick={() => onCopy(e)}>
            <Copy className="w-3.5 h-3.5" /> {isLast ? "Historiser" : "Copier"}
          </Button>
        )}
      </div>
    </div>
  );
};

const DernierControl: React.FC<DernierControlProps> = ({
  law,
  hasAS,
  history,
  // compat props unitaires
  controlDate, baremeColumn, by, updatedBy, result, actions, status, notes,
  // intégration
  pending = null,
  onCopyToHistory,
  onOverwriteLast,
  className = "",
}) => {
  const items = React.useMemo(
    () => normalizeHistory({ history, controlDate, baremeColumn, by, updatedBy, result, actions, status, notes, law }),
    [history, controlDate, baremeColumn, by, updatedBy, result, actions, status, notes, law]
  );
  const last = items[0];
  const older = items.slice(1);

  return (
    <Card className={`bg-white ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Clock3 className="w-4 h-4" />
            Dernier contrôle
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{LAW_LABELS[law as keyof typeof LAW_LABELS] ?? "Régime inconnu"}</Badge>
            <FrequencyBadge law={law} hasAS={hasAS} lastControlDate={last?.date} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Dernier contrôle (condensé) */}
        {last ? (
          <Line e={last} isLast onCopy={onCopyToHistory} />
        ) : (
          <div className="text-sm text-slate-500 flex items-center gap-2">
            <FileWarning className="w-4 h-4" />
            Aucun contrôle enregistré.
          </div>
        )}

        {/* Bandeau “Contrôle en cours” pour écraser */}
        {pending && (
          <>
            <Separator />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-medium text-slate-600 mb-1 flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5" />
                  Contrôle en cours (non enregistré)
                </div>
                <Line e={pending} />
              </div>
              <div className="flex-shrink-0">
                <Button
                  size="sm"
                  className="h-8 gap-1"
                  onClick={() => onOverwriteLast?.(pending)}
                >
                  Remplacer
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Historique repliable */}
        {older.length > 0 && (
          <>
            <Separator />
            <details>
              <summary className="text-xs text-slate-600 cursor-pointer select-none">
                Historique des contrôles ({older.length})
              </summary>
              <div className="mt-2 space-y-2">
                {older.map((e, i) => (
                  <Line key={e.id ?? `${e.date}-${i}`} e={e} onCopy={onCopyToHistory} />
                ))}
              </div>
            </details>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DernierControl;
