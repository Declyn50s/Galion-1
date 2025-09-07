// src/features/tenant/components/lease/TerminationCard.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, FileSignature, Info, Percent } from "lucide-react";

import type { LeaseCardCommonProps, OnClicks, LeaseValue, TerminationReason, AidState } from "./types";
import { CHF, lawGroupFromBase, computeRules, numberOr, parseNumber } from "./utils";

const MoneyInput: React.FC<{
  id: string;
  value?: number;
  onChange: (v?: number) => void;
  readOnly?: boolean;
  className?: string;
}> = ({ id, value, onChange, readOnly, className }) => {
  const [raw, setRaw] = React.useState(value ?? 0);
  React.useEffect(() => setRaw(value ?? 0), [value]);
  return (
    <Input
      id={id}
      value={raw === undefined ? "" : String(raw)}
      onChange={(e) => setRaw(parseNumber(e.target.value) ?? 0)}
      onBlur={() => onChange(raw)}
      inputMode="decimal"
      readOnly={readOnly}
      className={className}
    />
  );
};

const aidBadge = (label: string, s: { etat: AidState; delaiMois?: number }) => {
  const color =
    s.etat === "supprimée"
      ? "destructive"
      : s.etat === "partielle"
      ? "secondary"
      : s.etat === "maintenue"
      ? "default"
      : "outline";
  const txt = s.delaiMois && s.delaiMois > 0 ? `${label}: ${s.etat} (${s.delaiMois} mois)` : `${label}: ${s.etat}`;
  return (
    <Badge key={label} variant={color as any}>
      {txt}
    </Badge>
  );
};

const TerminationCard: React.FC<LeaseCardCommonProps & OnClicks> = ({
  value,
  onChange,
  onTerminateLease,
  className,
}) => {
  const v: LeaseValue = React.useMemo(() => ({ ...value }), [value]);
  const set = (patch: Partial<LeaseValue>) => onChange?.({ ...v, ...patch });

  const net = numberOr(v.rentLoweredMonthly ?? v.rentNetMonthly, 0);
  const lawGroup = lawGroupFromBase(v.legalBase);

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

  const autoSupplementMonthly = React.useMemo(() => {
    if (!outcome.supplementPercent) return undefined;
    const pct = outcome.supplementPercent / 100;
    const s = Math.round(net * pct);
    const annual = s * 12;
    if (annual < 120) return 0;
    return s;
  }, [outcome.supplementPercent, net]);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Résiliation
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-3">
            <Label htmlFor="terminationDate">Date résiliation</Label>
            <Input
              id="terminationDate"
              type="date"
              value={v.terminationDate ?? ""}
              onChange={(e) => set({ terminationDate: e.target.value })}
            />
          </div>

          <div className="md:col-span-4">
            <Label htmlFor="terminationReason">Motif (métier)</Label>
            <Select value={v.terminationReason ?? ""} onValueChange={(s) => set({ terminationReason: s as TerminationReason })}>
              <SelectTrigger id="terminationReason">
                <SelectValue placeholder="Sélectionner un motif…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SOS_SIMPLE">SOS – Sous-occupation simple</SelectItem>
                <SelectItem value="SON_NOTOIRE">SON – Sous-occupation notoire</SelectItem>
                <SelectItem value="RTE">RTE – Revenus trop élevés</SelectItem>
                <SelectItem value="DIF">DIF – Devoir d'information</SelectItem>
                <SelectItem value="SUR_OCCUPATION">SUR-OCCUPATION</SelectItem>
                <SelectItem value="AUTRE">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-3">
            <Label htmlFor="prolongationType">Prolongation</Label>
            <Select value={v.prolongationType ?? "AUCUNE"} onValueChange={(s) => set({ prolongationType: s as any })}>
              <SelectTrigger id="prolongationType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AUCUNE">Aucune</SelectItem>
                <SelectItem value="CONVENTION">Convention</SelectItem>
                <SelectItem value="AUDIENCE">Audience</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="overrunPercent">Dépassement (RDU en %)</Label>
            <div className="relative">
              <Input
                id="overrunPercent"
                value={v.overrunPercent ?? ""}
                onChange={(e) => set({ overrunPercent: parseNumber(e.target.value) })}
                inputMode="decimal"
                placeholder="ex. 18"
              />
              <Percent className="absolute right-2 top-2.5 h-4 w-4 text-slate-400" />
            </div>
          </div>

          <div className="md:col-span-3">
            <Label htmlFor="terminationProlongationEnd">Date fin prolongation</Label>
            <Input
              id="terminationProlongationEnd"
              type="date"
              value={v.terminationProlongationEnd ?? ""}
              onChange={(e) => set({ terminationProlongationEnd: e.target.value })}
            />
          </div>

          <div className="md:col-span-3">
            <Label>Résiliation effective</Label>
            <div className="flex items-center gap-2 h-10">
              <Switch
                id="terminationEffective"
                checked={!!v.terminationEffective}
                onCheckedChange={(c) => set({ terminationEffective: !!c })}
              />
              <span className="text-sm text-slate-600">{v.terminationEffective ? "Oui" : "Non"}</span>
            </div>
          </div>

          <div className="md:col-span-6">
            <Label>Exceptions</Label>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  id="conciergePro60"
                  checked={!!v.conciergePro60}
                  onCheckedChange={(c) => set({ conciergePro60: !!c })}
                />
                <span className="text-sm">Concierge pro ≥ 60%</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="avsSeul3Pieces"
                  checked={!!v.avsSeul3Pieces}
                  onCheckedChange={(c) => set({ avsSeul3Pieces: !!c })}
                />
                <span className="text-sm">AVS seul 3 pièces</span>
              </div>
            </div>
          </div>
        </div>

        {/* Conséquences */}
        <div className="rounded-md border p-3 bg-slate-50">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-semibold">Conséquences (règles automatiques)</span>
          </div>

          <div className="flex flex-wrap gap-2 mb-2">
            {aidBadge("Aides cantonales", outcome.aides.cantonales)}
            {aidBadge("Aides communales", outcome.aides.communales)}
            {aidBadge("AS", outcome.aides.AS)}
            <Badge variant={outcome.resiliation ? "destructive" : "outline"}>
              {outcome.resiliation ? "Résiliation" : "Pas de résiliation automatique"}
            </Badge>
            {outcome.supplementPercent ? (
              <Badge variant="secondary">
                Supplément {outcome.supplementPercent}% {outcome.supplementIsQuarterly ? "(trimestriel)" : ""}
              </Badge>
            ) : (
              <Badge variant="outline">Pas de supplément</Badge>
            )}
          </div>

          <ul className="list-disc pl-5 text-sm text-slate-700">
            {outcome.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-3">
            <Label htmlFor="newSupplement">Supplément mensuel (auto / manuel)</Label>
            <MoneyInput id="newSupplement" value={v.newSupplement ?? autoSupplementMonthly} onChange={(n) => set({ newSupplement: n })} />
            <p className="text-xs text-slate-500 mt-1">
              Auto: {outcome.supplementPercent ? `${outcome.supplementPercent}% du net` : "—"}
              {outcome.supplementNote ? ` • ${outcome.supplementNote}` : ""}
            </p>
          </div>

          <div className="md:col-span-3">
            <Label>AS1(P)</Label>
            <div className="grid grid-cols-4 gap-2">
              {(v.as1p ?? [0, 0, 0, 0]).map((n, i) => (
                <Input
                  key={i}
                  value={n}
                  onChange={(e) => {
                    const arr = [...(v.as1p ?? [0, 0, 0, 0])];
                    const val = parseNumber(e.target.value) ?? 0;
                    arr[i] = val;
                    set({ as1p: arr as [number, number, number, number] });
                  }}
                  inputMode="numeric"
                />
              ))}
            </div>
          </div>
        </div>

        <div>
          <Button variant="destructive" onClick={onTerminateLease} className="gap-2">
            <FileSignature className="h-4 w-4" />
            Résiliation du bail
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TerminationCard;
