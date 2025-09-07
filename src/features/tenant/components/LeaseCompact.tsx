// src/features/tenant/components/LeaseCompact.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  FileSignature,
  Banknote,
  AlertTriangle,
  Pencil,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import BailCard from "./lease/BailCard";
import RentAidCard from "./lease/RentAidCard";
import TerminationCard from "./lease/TerminationCard";

import type { LeaseValue } from "./lease/types";
import { CHF, numberOr, lawGroupFromBase, computeRules } from "./lease/utils";

export type LeaseCompactProps = {
  value?: LeaseValue;
  onChange?: (next: LeaseValue) => void;

  onModifyDates?: () => void;
  onModifyRent?: () => void;
  onTerminateLease?: () => void;

  className?: string;
};

/** Petite puce label: valeur */
const Item: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <div className="inline-flex items-center gap-1 text-xs">
    <span className="text-slate-500">{label}:</span>
    <span className="font-medium">{value ?? "—"}</span>
  </div>
);

/** Rangée de badges utilitaires */
const Pill: React.FC<{ children: React.ReactNode; variant?: "default" | "secondary" | "outline" | "destructive" }> = ({
  children,
  variant = "outline",
}) => <Badge variant={variant}>{children}</Badge>;

const LeaseCompact: React.FC<LeaseCompactProps> = ({
  value,
  onChange,
  onModifyDates,
  onModifyRent,
  onTerminateLease,
  className,
}) => {
  const v: LeaseValue = React.useMemo(() => ({ ...value }), [value]);

  // états d’édition (dépliés au clic)
  const [editBail, setEditBail] = React.useState(false);
  const [editRent, setEditRent] = React.useState(false);
  const [editTerm, setEditTerm] = React.useState(false);

  // dérivés pour résumés
  const lawGroup = lawGroupFromBase(v.legalBase);
  const net = numberOr(v.rentLoweredMonthly ?? v.rentNetMonthly, 0);
  const charges = numberOr(v.chargesMonthly, 0);
  const total = net + charges;

  const outcome = React.useMemo(
    () =>
      computeRules({
        lawGroup,
        reason: v.terminationReason,
        overrunPercent: v.overrunPercent,
        sonIsNotoire: v.terminationReason === "SON_NOTOIRE",
        exceptions: { conciergePro60: v.conciergePro60, avsSeul3Pieces: v.avsSeul3Pieces },
      }),
    [lawGroup, v.terminationReason, v.overrunPercent, v.conciergePro60, v.avsSeul3Pieces]
  );

  return (
    <Card className={cn("border bg-white", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Bail — Vue condensée</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* ======= BAIL (résumé) ======= */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSignature className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-semibold">Bail</span>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setEditBail((s) => !s)}>
              <Pencil className="h-4 w-4" />
              Modifier
              {editBail ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
          </div>

          {/* résumé bail */}
          <div className="flex flex-wrap items-center gap-2">
            <Pill variant="secondary">Régime: {lawGroup === "RC" ? "RC" : v.legalBase ?? "—"}</Pill>
            {v.rooms && <Pill>{v.rooms} pièces</Pill>}
            {v.floor && <Pill>{String(v.floor).toUpperCase()}</Pill>}
            {typeof v.entry !== "undefined" && v.entry !== "" && <Pill>Entrée {String(v.entry)}</Pill>}
            {v.lpg ? <Pill variant="secondary">LPG</Pill> : <Pill variant="outline">LPG: non</Pill>}
          </div>

          <div className="text-xs flex flex-wrap gap-x-4 gap-y-1">
            <Item label="Adresse" value={[v.address, v.entry].filter(Boolean).join(" ") || "—"} />
            <Item label="Appart." value={v.aptNumber || "—"} />
            <Item label="Début" value={v.startDate || "—"} />
            <Item label="Fin" value={v.endDate || "—"} />
            <Item label="Immeuble" value={v.building || "—"} />
          </div>

          {/* éditeur bail */}
          {editBail && (
            <div className="mt-3 border rounded-md">
              <BailCard value={v} onChange={onChange} onModifyDates={onModifyDates} />
            </div>
          )}
        </section>

        <Separator />

        {/* ======= LOYERS & AIDES (résumé) ======= */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-semibold">Loyers & aides</span>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setEditRent((s) => !s)}>
              <Pencil className="h-4 w-4" />
              Modifier
              {editRent ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
          </div>

          {/* résumé loyers */}
          <div className="flex flex-wrap items-center gap-2">
            <Pill>Loyer net: {CHF(net)}</Pill>
            <Pill>Charges: {CHF(charges)}</Pill>
            <Pill variant="secondary">Total: {CHF(total)}</Pill>
          </div>

          <div className="text-xs flex flex-wrap gap-x-4 gap-y-1">
            <Item label="Net abaissé" value={v.rentLoweredMonthly ? CHF(v.rentLoweredMonthly) : "—"} />
            <Item label="Supp. aide canton" value={v.suppressionAidCanton ? CHF(v.suppressionAidCanton) : "—"} />
            <Item label="Supp. aide commune" value={v.suppressionAidCommune ? CHF(v.suppressionAidCommune) : "—"} />
            <Item label="Loyer commune/canton" value={v.communityRent ? CHF(v.communityRent) : "—"} />
            <Item label="Loyer aide fédérale" value={v.federalAidRent ? CHF(v.federalAidRent) : "—"} />
            <Item label="Supplément (bail)" value={v.bailSupplement ? CHF(v.bailSupplement) : "—"} />
            <Item label="Loyer selon bail (net)" value={v.bailRentAlone ? CHF(v.bailRentAlone) : "—"} />
          </div>

          {/* éditeur loyers */}
          {editRent && (
            <div className="mt-3 border rounded-md">
              <RentAidCard value={v} onChange={onChange} onModifyRent={onModifyRent} />
            </div>
          )}
        </section>

        <Separator />

        {/* ======= RÉSILIATION (résumé) ======= */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-semibold">Résiliation</span>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setEditTerm((s) => !s)}>
              <Pencil className="h-4 w-4" />
              Modifier
              {editTerm ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
          </div>

          {/* résumé résiliation / conséquences */}
          <div className="flex flex-wrap items-center gap-2">
            <Pill variant={outcome.resiliation ? "destructive" : "outline"}>
              {outcome.resiliation ? "Résiliation (règle)" : "Pas de résiliation automatique"}
            </Pill>
            {outcome.supplementPercent ? (
              <Pill variant="secondary">Supplément {outcome.supplementPercent}%</Pill>
            ) : (
              <Pill>Supplément: —</Pill>
            )}
            {v.terminationReason && <Pill>Motif: {v.terminationReason.replace("_", " ")}</Pill>}
            {typeof v.overrunPercent === "number" && <Pill>Dépassement: {v.overrunPercent}%</Pill>}
            {v.conciergePro60 && <Pill>Concierge ≥ 60%</Pill>}
            {v.avsSeul3Pieces && <Pill>AVS seul 3p</Pill>}
          </div>

          <div className="text-xs flex flex-wrap gap-2">
            {/* Aides */}
            <Badge variant={
              outcome.aides.cantonales.etat === "supprimée" ? "destructive" :
              outcome.aides.cantonales.etat === "partielle" ? "secondary" :
              outcome.aides.cantonales.etat === "maintenue" ? "default" : "outline"
            }>
              Aides cantonales: {outcome.aides.cantonales.etat}
              {outcome.aides.cantonales.delaiMois ? ` (${outcome.aides.cantonales.delaiMois} mois)` : ""}
            </Badge>
            <Badge variant={
              outcome.aides.communales.etat === "supprimée" ? "destructive" :
              outcome.aides.communales.etat === "partielle" ? "secondary" :
              outcome.aides.communales.etat === "maintenue" ? "default" : "outline"
            }>
              Aides communales: {outcome.aides.communales.etat}
              {outcome.aides.communales.delaiMois ? ` (${outcome.aides.communales.delaiMois} mois)` : ""}
            </Badge>
            <Badge variant={
              outcome.aides.AS.etat === "supprimée" ? "destructive" :
              outcome.aides.AS.etat === "partielle" ? "secondary" :
              outcome.aides.AS.etat === "maintenue" ? "default" : "outline"
            }>
              AS: {outcome.aides.AS.etat}
              {outcome.aides.AS.delaiMois ? ` (${outcome.aides.AS.delaiMois} mois)` : ""}
            </Badge>
          </div>

          {/* éditeur résiliation */}
          {editTerm && (
            <div className="mt-3 border rounded-md">
              <TerminationCard value={v} onChange={onChange} onTerminateLease={onTerminateLease} />
            </div>
          )}
        </section>
      </CardContent>
    </Card>
  );
};

export default LeaseCompact;
