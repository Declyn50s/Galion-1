// section sur la page (badges, bouton "Contrôle")
// src/features/tenant/components/ControlPanel/ControlPanel.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calculator,
  Clipboard,
  ShieldAlert,
  FileWarning,
  Scale,
} from "lucide-react";

import { columnFromChildrenCount, computeBareme } from "@/lib/bareme";
import { LAW_LABELS, EXCEPTIONS } from "@/features/tenant/control/config";

// ----------------- Types publics -----------------
export type LawKind = "RC" | "LC.75" | "LC.2007" | "UNKNOWN";

export type ControlResult = {
  law: LawKind;
  rooms?: number;
  adults: number;
  minors: number;

  // SON
  underOcc: "none" | "simple" | "notoire";
  overOcc: "none" | "sur";

  // RTE
  rdu?: number;
  rentNetMonthly?: number;
  baremeColumn?: 1 | 2 | 3 | 4 | 5;
  cap?: number;
  rte: "none" | "lte20" | "gt20";
  percentOverCap?: number;

  // Explications / actions
  notes: string[];
  actions: string[];
};

export type ControlPanelProps = {
  law: LawKind;
  adults: number;
  minors: number;
  rooms?: number;
  rentNetMonthly?: number; // Loyer net mensuel (CHF)
  rduTotal?: number; // RDU ménage (CHF)

  exceptions?: { dm4Concierge?: boolean; dm5AVSSeul3p?: boolean };

  // Remontées d'édition
  onChange?: (p: {
    rooms?: number;
    rentNetMonthly?: number;
    rduTotal?: number;
    exceptions?: ControlPanelProps["exceptions"];
  }) => void;

  // Callback quand on clique "Contrôler"
  onRun?: (result: ControlResult) => void;

  className?: string;
};

// ----------------- Helpers -----------------
const formatCHF = (n?: number) =>
  typeof n === "number" && !Number.isNaN(n)
    ? `CHF ${n.toLocaleString("fr-CH", { maximumFractionDigits: 0 })}`
    : "—";

function lawLabel(law: LawKind): string {
  return LAW_LABELS[law as keyof typeof LAW_LABELS] ?? "Régime inconnu";
}

/** SON: calcule sous/sur-occupation selon les règles données.
 *  ⚠️ Sous-occupation simple uniquement pour 4 ou 5 pièces.
 */
function computeOccupation(adults: number, minors: number, rooms?: number) {
  let underOcc: ControlResult["underOcc"] = "none";
  let overOcc: ControlResult["overOcc"] = "none";
  if (typeof rooms === "number" && rooms > 0) {
    const unitsUnder = adults + Math.ceil(minors / 2);
    const diffUnder = rooms - unitsUnder;

    if (diffUnder >= 2) {
      underOcc = "notoire";
    } else if (diffUnder === 1 && rooms >= 4) {
      // simple uniquement pour 4 et 5 pièces
      underOcc = "simple";
    }

    const diffOver = adults - rooms; // mineurs exclus
    if (diffOver >= 2) overOcc = "sur";
  }
  return { underOcc, overOcc };
}

/** RTE: revient avec colonne, cap, % dépassement et palier. Applique DM4 si activé. */
function computeRTE(
  minors: number,
  rentNetMonthly?: number,
  rduTotal?: number,
  dm4?: boolean
) {
  if (!rentNetMonthly || !rduTotal) {
    return {
      baremeColumn: undefined,
      cap: undefined,
      percentOverCap: undefined,
      rte: "none" as const,
      notes: ["RTE : données manquantes (loyer net et/ou RDU)."],
    };
  }
  const col = columnFromChildrenCount(minors);
  const cap = computeBareme(rentNetMonthly, col).incomeCap;

  let pct = ((rduTotal - cap) / cap) * 100;
  if (dm4) pct = Math.max(pct - EXCEPTIONS.DM4_CONCIERGE_PCT_TOLERANCE, 0);

  const percentOverCap = Math.max(0, Math.round(pct * 10) / 10);
  const rte: "none" | "lte20" | "gt20" =
    pct <= 0 ? "none" : pct < 20 ? "lte20" : "gt20";
  const notes: string[] = [];
  if (dm4)
    notes.push(
      "DM4 (concierge ≥60%) : tolérance de 40 points appliquée sur le dépassement."
    );

  return { baremeColumn: col, cap, percentOverCap, rte, notes };
}

/** Genère les actions textuelles selon la loi + résultats. */
function buildActions(
  law: LawKind,
  underOcc: ControlResult["underOcc"],
  overOcc: ControlResult["overOcc"],
  rte: ControlResult["rte"]
) {
  const actions: string[] = [];

  // SON
  if (underOcc === "simple") {
    if (law === "RC")
      actions.push("Sous-occupation simple → +20% du loyer net (RC).");
    else if (law === "LC.75")
      actions.push("Sous-occupation simple → suppression des aides (LC.75).");
    else if (law === "LC.2007")
      actions.push("Sous-occupation simple → aides maintenues (LC.2007).");
  } else if (underOcc === "notoire") {
    if (law === "RC")
      actions.push(
        "Sous-occupation notoire → résiliation + +20% du loyer net (RC)."
      );
    else if (law === "LC.75")
      actions.push(
        "Sous-occupation notoire → résiliation + suppression des aides (LC.75)."
      );
    else if (law === "LC.2007")
      actions.push(
        "Sous-occupation notoire → résiliation + suppression des aides (LC.2007)."
      );
  }

  if (overOcc === "sur") {
    actions.push(
      "Sur-occupation (≥ 2 adultes au-dessus des pièces) → mesure à qualifier, résiliation possible."
    );
  }

  // RTE
  if (rte === "lte20") {
    if (law === "RC") actions.push("RTE < 20% → +50% du loyer net (RC).");
    else if (law === "LC.75")
      actions.push(
        "RTE < 20% → suppression partielle/totale des aides (LC.75)."
      );
    else if (law === "LC.2007")
      actions.push("RTE < 20% → aides maintenues (LC.2007).");
  } else if (rte === "gt20") {
    if (law === "RC")
      actions.push("RTE ≥ 20% → +50% du loyer net + résiliation (RC).");
    else if (law === "LC.75")
      actions.push(
        "RTE ≥ 20% → suppression totale des aides + résiliation (LC.75)."
      );
    else if (law === "LC.2007")
      actions.push(
        "RTE ≥ 20% → suppression aides (6 mois) + AS immédiate + résiliation (LC.2007)."
      );
  }

  return actions;
}

// ----------------- Composant -----------------
const ControlPanel: React.FC<ControlPanelProps> = ({
  law,
  adults,
  minors,
  rooms,
  rentNetMonthly,
  rduTotal,
  exceptions,
  onChange,
  onRun,
  className,
}) => {
  const [loc, setLoc] = React.useState({
    rooms: rooms ?? undefined,
    rentNetMonthly: rentNetMonthly ?? undefined,
    rduTotal: rduTotal ?? undefined,
    dm4Concierge: !!exceptions?.dm4Concierge,
    dm5AVSSeul3p: !!exceptions?.dm5AVSSeul3p,
  });

  React.useEffect(() => {
    setLoc((s) => ({
      ...s,
      rooms: rooms ?? s.rooms,
      rentNetMonthly: rentNetMonthly ?? s.rentNetMonthly,
      rduTotal: rduTotal ?? s.rduTotal,
    }));
  }, [rooms, rentNetMonthly, rduTotal]);

  const pushChange = (patch: Partial<typeof loc>) => {
    const next = { ...loc, ...patch };
    setLoc(next);
    onChange?.({
      rooms: next.rooms,
      rentNetMonthly: next.rentNetMonthly,
      rduTotal: next.rduTotal,
      exceptions: {
        dm4Concierge: next.dm4Concierge,
        dm5AVSSeul3p: next.dm5AVSSeul3p,
      },
    });
  };

  // Calculs
  const { underOcc, overOcc } = computeOccupation(adults, minors, loc.rooms);
  const rteCalc = computeRTE(
    minors,
    loc.rentNetMonthly,
    loc.rduTotal,
    loc.dm4Concierge
  );
  const actions = buildActions(law, underOcc, overOcc, rteCalc.rte);

  const result: ControlResult = {
    law,
    rooms: loc.rooms,
    adults,
    minors,
    underOcc,
    overOcc,
    rdu: loc.rduTotal,
    rentNetMonthly: loc.rentNetMonthly,
    baremeColumn: rteCalc.baremeColumn,
    cap: rteCalc.cap,
    rte: rteCalc.rte,
    percentOverCap: rteCalc.percentOverCap,
    notes: [
      ...rteCalc.notes,
      ...(loc.dm5AVSSeul3p
        ? ["DM5 (AVS seul, 3 pièces) : maintien possible malgré SON."]
        : []),
    ],
    actions,
  };

  const summaryText = [
    `Régime: ${lawLabel(law)}`,
    typeof loc.rooms === "number" ? `${loc.rooms} pièces` : "Pièces: —",
    `${adults} adulte(s), ${minors} mineur(s)`,
    loc.rentNetMonthly
      ? `Loyer net: ${formatCHF(loc.rentNetMonthly)}`
      : "Loyer net: —",
    loc.rduTotal ? `RDU ménage: ${formatCHF(loc.rduTotal)}` : "RDU ménage: —",
    rteCalc.baremeColumn
      ? `Colonne barème: ${rteCalc.baremeColumn}`
      : "Colonne barème: —",
    typeof rteCalc.cap === "number"
      ? `CAP: ${formatCHF(rteCalc.cap)}`
      : "CAP: —",
    rteCalc.rte !== "none"
      ? `RTE: +${rteCalc.percentOverCap}% (${
          rteCalc.rte === "lte20" ? "<20%" : "≥20%"
        })`
      : "RTE: aucun dépassement",
    underOcc === "notoire"
      ? "SON: notoire"
      : underOcc === "simple"
      ? "SOS: simple"
      : "SON: —",
    overOcc === "sur" ? "Sur-occupation: oui" : "Sur-occupation: —",
  ].join("\n");

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(
        summaryText + "\n\n" + actions.map((a) => `• ${a}`).join("\n")
      );
    } catch (_) {}
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5" />
          Contrôle — Paramètres & Résultat
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Paramètres */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pièces (bail) — LISTE DÉROULANTE */}
          <div className="space-y-2">
            <Label>Pièces (bail)</Label>
            <Select
              value={typeof loc.rooms === "number" ? String(loc.rooms) : ""}
              onValueChange={(value) => pushChange({ rooms: Number(value) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 pièce</SelectItem>
                <SelectItem value="2">2 pièces</SelectItem>
                <SelectItem value="3">3 pièces</SelectItem>
                <SelectItem value="4">4 pièces</SelectItem>
                <SelectItem value="5">5 pièces</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              La sous-occupation <strong>simple</strong> ne s’applique que pour
              les <strong>4–5 pièces</strong>.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Loyer net mensuel</Label>
            <Input
              inputMode="numeric"
              placeholder="ex. 1250"
              value={loc.rentNetMonthly ?? ""}
              onChange={(e) => {
                const v = e.target.value.trim();
                const n =
                  v === ""
                    ? undefined
                    : Number(v.replace(/\s/g, "").replace(",", "."));
                pushChange({
                  rentNetMonthly: Number.isFinite(n as number)
                    ? (n as number)
                    : undefined,
                });
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>RDU ménage</Label>
            <Input
              inputMode="numeric"
              placeholder="ex. 58200"
              value={loc.rduTotal ?? ""}
              onChange={(e) => {
                const v = e.target.value.trim();
                const n =
                  v === ""
                    ? undefined
                    : Number(v.replace(/\s/g, "").replace(",", "."));
                pushChange({
                  rduTotal: Number.isFinite(n as number)
                    ? (n as number)
                    : undefined,
                });
              }}
            />
          </div>
        </div>

        {/* Exceptions */}
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Switch
              id="dm4"
              checked={loc.dm4Concierge}
              onCheckedChange={(c) => pushChange({ dm4Concierge: c })}
            />
            <Label htmlFor="dm4">DM4 Concierge (≥ 60%)</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="dm5"
              checked={loc.dm5AVSSeul3p}
              onCheckedChange={(c) => pushChange({ dm5AVSSeul3p: c })}
            />
            <Label htmlFor="dm5">DM5 AVS seul (3 pièces)</Label>
          </div>
        </div>

        <Separator />

        {/* Résumé badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{lawLabel(law)}</Badge>
          {typeof loc.rooms === "number" && (
            <Badge variant="outline">{loc.rooms} pièces</Badge>
          )}
          <Badge variant="outline">{adults} adulte(s)</Badge>
          <Badge variant="outline">{minors} mineur(s)</Badge>
          {typeof loc.rentNetMonthly === "number" && (
            <Badge variant="outline">
              Loyer: {formatCHF(loc.rentNetMonthly)}
            </Badge>
          )}
          {typeof loc.rduTotal === "number" && (
            <Badge variant="outline">RDU: {formatCHF(loc.rduTotal)}</Badge>
          )}
          {rteCalc.baremeColumn && (
            <Badge variant="outline">Col. {rteCalc.baremeColumn}</Badge>
          )}
          {typeof rteCalc.cap === "number" && (
            <Badge variant="secondary">CAP: {formatCHF(rteCalc.cap)}</Badge>
          )}
          {rteCalc.rte !== "none" &&
            typeof rteCalc.percentOverCap === "number" && (
              <Badge
                variant={
                  rteCalc.percentOverCap >= 20 ? "destructive" : "default"
                }
              >
                +{rteCalc.percentOverCap}% RTE
              </Badge>
            )}
          {underOcc === "simple" && (
            <Badge variant="default">SOS: simple</Badge>
          )}
          {underOcc === "notoire" && (
            <Badge variant="destructive">SON: notoire</Badge>
          )}
          {overOcc === "sur" && (
            <Badge variant="destructive">Sur-occupation</Badge>
          )}
        </div>

        {/* Avertissements / Notes */}
        {(result.notes.length > 0 ||
          (rteCalc.rte === "none" &&
            (!loc.rentNetMonthly || !loc.rduTotal))) && (
          <Alert>
            <FileWarning className="h-4 w-4" />
            <AlertDescription>
              {result.notes.length > 0 ? (
                <ul className="list-disc pl-5 space-y-1">
                  {result.notes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              ) : (
                "Renseignez le loyer net et le RDU pour évaluer le RTE."
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Recommandations */}
        <div>
          <div className="font-medium mb-2 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            Conséquences / recommandations
          </div>
          {actions.length === 0 ? (
            <div className="text-sm text-slate-500">
              Aucune mesure proposée.
            </div>
          ) : (
            <ul className="list-disc pl-5 space-y-1 text-sm">
              {actions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="outline" onClick={copySummary} className="gap-2">
            <Clipboard className="h-4 w-4" />
            Copier le résumé
          </Button>
          <Button onClick={() => onRun?.(result)} className="gap-2">
            <Calculator className="h-4 w-4" />
            Contrôler
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ControlPanel;
