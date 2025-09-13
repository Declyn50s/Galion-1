// src/features/tenant/components/lease/RentAidCard.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Banknote, Calculator } from "lucide-react";
import type { LeaseCardCommonProps, OnClicks, LeaseValue } from "./types";
import { CHF, numberOr, parseNumber } from "./utils";

/**
 * MoneyInput
 * - Garde une string pendant la frappe (évite l’écrasement à 0/"" en cours de saisie).
 * - Au blur/Enter: commit seulement si c'est un nombre valide; sinon rollback à la dernière valeur valide.
 * - Resync depuis la prop uniquement si la valeur externe a vraiment changé (évite les resets pendant la frappe).
 */
const MoneyInput: React.FC<{
  id: string;
  value?: number;
  onChange: (v?: number) => void;
  readOnly?: boolean;
  className?: string;
}> = ({ id, value, onChange, readOnly, className }) => {
  const [committed, setCommitted] = React.useState<number | undefined>(value);
  const [raw, setRaw] = React.useState<string>(
    value != null ? String(value) : ""
  );

  // Resynchronise seulement quand la valeur externe ≠ dernière valeur commitée
  React.useEffect(() => {
    if (value !== committed) {
      setCommitted(value);
      setRaw(value != null ? String(value) : "");
    }
  }, [value, committed]);

  const normalizeForParse = (s: string) =>
    s
      .trim()
      .replace(/\s+/g, "") // espaces
      .replace(/['’_]/g, "") // séparateurs de milliers usuels
      .replace(",", "."); // virgule -> point

  const commitIfValid = () => {
    const normalized = normalizeForParse(raw);
    const n = parseNumber(normalized);

    if (n == null || Number.isNaN(n)) {
      // invalide -> rollback affichage, ne remonte rien
      setRaw(committed != null ? String(committed) : "");
      return;
    }

    if (n !== committed) {
      setCommitted(n);
      onChange(n);
      // On laisse le parent propager value; raw sera resync via useEffect si besoin
    }
  };

  return (
    <Input
      id={id}
      value={raw}
      onChange={(e) => {
        // Autorise états transitoires (vide, "-", "1,", etc.). Filtre le reste.
        const next = e.target.value.replace(/[^\d.,\s\-+'’_]/g, "");
        setRaw(next);
      }}
      onBlur={commitIfValid}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          (e.currentTarget as HTMLInputElement).blur();
        }
      }}
      onFocus={(e) => e.currentTarget.select()}
      inputMode="decimal"
      readOnly={readOnly}
      className={className}
    />
  );
};

const RentAidCard: React.FC<LeaseCardCommonProps & OnClicks> = ({
  value,
  onChange,
  onModifyRent,
  className,
}) => {
  const v: LeaseValue = React.useMemo(() => ({ ...value }), [value]);
  const set = (patch: Partial<LeaseValue>) => onChange?.({ ...v, ...patch });

  const net = numberOr(v.rentLoweredMonthly ?? v.rentNetMonthly, 0);
  const annualNet = net * 12;
  const charges = numberOr(v.chargesMonthly, 0);
  const totalMonthly = net + charges;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Banknote className="h-5 w-5" />
          Loyers & aides
        </CardTitle>
        <div className="mt-2 grid grid-cols-3 gap-3 text-right">
          <div className="rounded-md border bg-white px-3 py-2">
            <div className="text-xs text-slate-500">Loyer net</div>
            <div className="font-semibold">{CHF(net)}</div>
          </div>
          <div className="rounded-md border bg-white px-3 py-2">
            <div className="text-xs text-slate-500">Charges</div>
            <div className="font-semibold">{CHF(charges)}</div>
          </div>
          <div className="rounded-md border bg-white px-3 py-2">
            <div className="text-xs text-slate-500">Total mensuel</div>
            <div className="font-semibold">{CHF(totalMonthly)}</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-3">
            <Label htmlFor="rentNetMonthly">Loyer mens. net</Label>
            <MoneyInput
              id="rentNetMonthly"
              value={v.rentNetMonthly}
              onChange={(n) => set({ rentNetMonthly: n })}
            />
          </div>

          <div className="md:col-span-3">
            <Label htmlFor="rentLoweredMonthly">Abaissé</Label>
            <MoneyInput
              id="rentLoweredMonthly"
              value={v.rentLoweredMonthly}
              onChange={(n) => set({ rentLoweredMonthly: n })}
            />
          </div>

          <div className="md:col-span-3">
            <Label htmlFor="annualNet">Loyer annuel net</Label>
            {/* Affichage non modifiable, sélectionnable, ignoré par Tab */}
            <Input
              id="annualNet"
              value={CHF(annualNet)}
              readOnly
              tabIndex={-1}
              aria-readonly="true"
              className="bg-slate-100 text-slate-700"
            />
          </div>

          <div className="md:col-span-3">
            <Label htmlFor="chargesMonthly">Charges</Label>
            <MoneyInput
              id="chargesMonthly"
              value={v.chargesMonthly}
              onChange={(n) => set({ chargesMonthly: n })}
            />
          </div>

          <Separator className="md:col-span-12" />

          <div className="md:col-span-3">
            <Label htmlFor="suppAidCanton">Suppression Aide Canton</Label>
            <MoneyInput
              id="suppAidCanton"
              value={v.suppressionAidCanton}
              onChange={(n) => set({ suppressionAidCanton: n })}
            />
          </div>

          <div className="md:col-span-3">
            <Label htmlFor="suppAidCommune">Suppression Aide Commune</Label>
            <MoneyInput
              id="suppAidCommune"
              value={v.suppressionAidCommune}
              onChange={(n) => set({ suppressionAidCommune: n })}
            />
          </div>

          <div className="md:col-span-3">
            <Label htmlFor="communityRent">Loyer commune / canton</Label>
            <MoneyInput
              id="communityRent"
              value={v.communityRent}
              onChange={(n) => set({ communityRent: n })}
            />
          </div>

          <div className="md:col-span-3">
            <Label htmlFor="federalAidRent">Loyer (aide fédérale)</Label>
            <MoneyInput
              id="federalAidRent"
              value={v.federalAidRent}
              onChange={(n) => set({ federalAidRent: n })}
            />
          </div>

          <div className="md:col-span-3">
            <Label htmlFor="bailSupplement">Supplément loyer bail</Label>
            <MoneyInput
              id="bailSupplement"
              value={v.bailSupplement}
              onChange={(n) => set({ bailSupplement: n })}
            />
          </div>

          <div className="md:col-span-3">
            <Label htmlFor="bailRentAlone">Loyer selon bail (net)</Label>
            <MoneyInput
              id="bailRentAlone"
              value={v.bailRentAlone}
              onChange={(n) => set({ bailRentAlone: n })}
            />
          </div>
        </div>

        <div>
          <Button variant="outline" onClick={onModifyRent} className="gap-2">
            <Calculator className="h-4 w-4" />
            Modification loyer / montant bail
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RentAidCard;
