import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertTriangle,
  Calendar,
  FileSignature,
  Percent,
  Banknote,
  Calculator,
  Factory,
  MapPin,
} from "lucide-react";

// On s'appuie sur tes données immeubles existantes
import { IMMEUBLES, stripDiacritics } from "@/data/immeubles";

// ─────────────────────────────────────────────────────────
// Helpers adresse (local, pour être indépendant des exports optionnels)

type LawBase = "LC.53" | "LC.65" | "LC.75" | "LC.2007" | "RC.47" | "RC.53" | "RC.65";

const U = (s: string) =>
  stripDiacritics(String(s ?? ""))
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();

const TYPES = new Set([
  "AVENUE",
  "AV",
  "AV.",
  "RUE",
  "R",
  "R.",
  "ROUTE",
  "RTE",
  "RT.",
  "CHEMIN",
  "CH",
  "CH.",
  "BOULEVARD",
  "BD",
  "PLACE",
  "PL",
  "IMPASSE",
  "IMP",
  "ALLEE",
  "ALL",
  "ALL.",
  "QUAI",
  "PROMENADE",
  "PROM",
  "CITE",
  "CTE",
]);
const ARTICLES = new Set(["DE", "DU", "DES", "LA", "LE", "L'", "D'"]);

/** "Rue de la Borde 32" -> "BORDE" */
function streetCore(input: string): string {
  const s = U(input).replace(/[,.;]/g, " ");
  const parts = s.split(/\s+/).filter(Boolean);
  const kept = parts.filter(
    (w) => !TYPES.has(w) && !ARTICLES.has(w) && !/^\d+[A-Z]*$/.test(w)
  );
  return kept.join(" ").replace(/\s+/g, " ").trim();
}

/** Premier numéro trouvé (lettres ignorées) */
function firstHouseNumber(input: string): number | null {
  const m = U(input).match(/(\d{1,5})/);
  return m ? parseInt(m[1], 10) : null;
}

type Range = [number, number];

/** "26-30", "32", "12:14/16B-22B", "8a10", "51-57 BIS", "2-6 + 8-12" -> plages fusionnées */
function rangesFromAdresse(adr: string): Range[] {
  let s = U(adr);
  s = s.replace(/(\d+)A(\d+)/g, "$1-$2"); // 8A10 -> 8-10
  s = s.replace(/[:/+,]/g, " ");
  s = s.replace(/(\d+)[A-Z]+/g, "$1"); // 16B -> 16
  s = s.replace(/[^0-9\- ]+/g, " ").replace(/\s+/g, " ").trim();

  const ranges: Range[] = [];
  for (const tok of s.split(" ")) {
    if (!tok) continue;
    if (/^\d+$/.test(tok)) {
      const n = parseInt(tok, 10);
      ranges.push([n, n]);
    } else if (/^\d+\-\d+$/.test(tok)) {
      let [a, b] = tok.split("-").map((x) => parseInt(x, 10));
      if (!Number.isNaN(a) && !Number.isNaN(b)) {
        if (a > b) [a, b] = [b, a];
        ranges.push([a, b]);
      }
    }
  }
  ranges.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
  const merged: Range[] = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (!last) merged.push([...r] as Range);
    else if (r[0] <= last[1] + 1) last[1] = Math.max(last[1], r[1]);
    else merged.push([...r] as Range);
  }
  return merged;
}

/** Déduit la base légale depuis une adresse utilisateur (ex: "BERNE 9") */
function guessBaseFromImmeubles(userAdresse: string): LawBase | null {
  const core = streetCore(userAdresse);
  if (!core) return null;
  const n = firstHouseNumber(userAdresse);

  // Filtrer toutes les lignes de la même rue
  const rows = IMMEUBLES.filter((r) => streetCore(r.adresse) === core);
  if (rows.length === 0) return null;

  if (n == null) {
    return rows[0].base as LawBase; // meilleure hypothèse
  }

  for (const r of rows) {
    const ranges = rangesFromAdresse(r.adresse);
    if (ranges.some(([a, b]) => n >= a && n <= b)) return r.base as LawBase;
  }
  return rows[0].base as LawBase; // fallback doux
}

/** Regroupement RC.* -> "RC", sinon base inchangée, sinon "UNKNOWN" */
function lawGroupFromBase(base?: string | null):
  | "RC"
  | "LC.53"
  | "LC.65"
  | "LC.75"
  | "LC.2007"
  | "UNKNOWN" {
  const b = String(base || "").toUpperCase();
  if (!b) return "UNKNOWN";
  if (b.startsWith("RC.")) return "RC";
  if (b === "LC.53") return "LC.53";
  if (b === "LC.65") return "LC.65";
  if (b === "LC.75") return "LC.75";
  if (b === "LC.2007") return "LC.2007";
  return "UNKNOWN";
}
// ─────────────────────────────────────────────────────────

export type LeaseValue = {
  startDate?: string;
  endDate?: string;
  legalBase?: LawBase; // détectée automatiquement si adresse fournie
  lpg?: boolean;
  building?: string | number;
  address?: string; // ex: "BERNE"
  entry?: string | number; // ex: "9" -> "BERNE 9"
  aptNumber?: string | number;
  floor?: string;
  rooms?: number;

  rentNetMonthly?: number;
  rentLoweredMonthly?: number;
  chargesMonthly?: number;

  suppressionAidCanton?: number;
  suppressionAidCommune?: number;
  communityRent?: number;
  federalAidRent?: number;
  bailSupplement?: number;
  bailRentAlone?: number;

  terminationDate?: string;
  terminationVisa?: "Ordinaire" | "Extraordinaire" | "Pour sous-occupation" | "Autre";
  terminationEffective?: boolean;
  terminationProlongationEnd?: string;

  overrunPercent?: number;
  newSupplement?: number;

  as1p?: [number, number, number, number];

  agency?: {
    name?: string;
    phone?: string;
    address?: string;
    npa?: string;
    city?: string;
    email?: string;
  };
};

export type LeaseCardProps = {
  value?: LeaseValue;
  onChange?: (next: LeaseValue) => void;

  onModifyDates?: () => void;
  onModifyRent?: () => void;
  onTerminateLease?: () => void;

  className?: string;
};

const CHF = (n?: number) =>
  `CHF ${Intl.NumberFormat("fr-CH", { maximumFractionDigits: 0 }).format(n ?? 0)}`;

const parseNumber = (v: string) => {
  const n = Number(String(v).replace(/[^\d.,-]/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
};

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

const numberOr = (v?: number, def = 0) =>
  typeof v === "number" && !Number.isNaN(v) ? v : def;

const LeaseCard: React.FC<LeaseCardProps> = ({
  value,
  onChange,
  onModifyDates,
  onModifyRent,
  onTerminateLease,
  className,
}) => {
  const v: LeaseValue = React.useMemo(
    () => ({
      legalBase: value?.legalBase, // pas de valeur en dur
      lpg: false,
      floor: "rez",
      rooms: value?.rooms,
      rentNetMonthly: value?.rentNetMonthly,
      chargesMonthly: value?.chargesMonthly,
      bailRentAlone: value?.bailRentAlone,
      as1p: value?.as1p ?? [0, 0, 0, 0],
      ...value,
    }),
    [value]
  );

  const set = (patch: Partial<LeaseValue>) => onChange?.({ ...v, ...patch });

  // ===== Détection auto de la base depuis l'adresse du bail =====
  // Combine "rue + entrée" si les deux existent
  const combinedAdresse = React.useMemo(
    () => [v.address, v.entry].filter(Boolean).join(" ").trim(),
    [v.address, v.entry]
  );

  // L'utilisateur peut forcer la base → on n'écrase pas tant qu'il n'appuie pas sur "Auto"
  const manualBaseRef = React.useRef(false);

  const suggestedBase = React.useMemo(
    () => (combinedAdresse ? guessBaseFromImmeubles(combinedAdresse) : null),
    [combinedAdresse]
  );

  React.useEffect(() => {
    if (manualBaseRef.current) return;
    if (!combinedAdresse) return;
    const base = guessBaseFromImmeubles(combinedAdresse);
    if (base && base !== v.legalBase) {
      set({ legalBase: base });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combinedAdresse]);

  const onManualBaseChange = (b: LawBase) => {
    manualBaseRef.current = true;
    set({ legalBase: b });
  };

  const resetAutoBase = () => {
    manualBaseRef.current = false;
    if (combinedAdresse) {
      const base = guessBaseFromImmeubles(combinedAdresse);
      if (base) set({ legalBase: base });
    }
  };

  // ===== Calculs dérivés =====
  const net = numberOr(v.rentLoweredMonthly ?? v.rentNetMonthly, 0);
  const annualNet = net * 12;
  const charges = numberOr(v.chargesMonthly, 0);
  const totalMonthly = net + charges;

  const lawGroup = lawGroupFromBase(v.legalBase);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileSignature className="h-5 w-5" />
              Bail
            </CardTitle>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="secondary">
                Régime&nbsp;: {lawGroup === "RC" ? "RC" : v.legalBase ?? "—"}
              </Badge>
              {v.rooms && <Badge variant="outline">{v.rooms} pièce(s)</Badge>}
              {v.floor && <Badge variant="outline">{String(v.floor).toUpperCase()}</Badge>}
              {typeof v.entry !== "undefined" && v.entry !== "" && (
                <Badge variant="outline">Entrée {String(v.entry)}</Badge>
              )}
              <Badge variant={suggestedBase ? "outline" : "destructive"}>
                {suggestedBase ? `Base détectée: ${suggestedBase}` : "Adresse non trouvée"}
              </Badge>
            </div>
          </div>

          {/* Résumé chiffres */}
          <div className="grid grid-cols-3 gap-3 text-right">
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
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* ───── Section: Bail ───── */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-semibold tracking-wide text-slate-700">
              Informations de bail
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-3">
              <Label htmlFor="address">Adresse (rue)</Label>
              <div className="relative">
                <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  id="address"
                  className="pl-7"
                  value={v.address ?? ""}
                  onChange={(e) => set({ address: e.target.value })}
                  placeholder='Ex: "BERNE"'
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="entry">Entrée / n°</Label>
              <Input
                id="entry"
                value={v.entry ?? ""}
                onChange={(e) => set({ entry: e.target.value })}
                placeholder="9"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="apt">Appartement</Label>
              <Input
                id="apt"
                value={v.aptNumber ?? ""}
                onChange={(e) => set({ aptNumber: e.target.value })}
                placeholder="902"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="rooms">Pièces</Label>
              <Select
                value={String(v.rooms ?? "")}
                onValueChange={(s) => set({ rooms: Number(s) })}
              >
                <SelectTrigger id="rooms">
                  <SelectValue placeholder="3.5" />
                </SelectTrigger>
                <SelectContent>
                  {["1.5", "2.5", "3.5", "4.5", "5.5", "6.5"].map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="floor">Étage</Label>
              <Select value={v.floor ?? ""} onValueChange={(s) => set({ floor: s })}>
                <SelectTrigger id="floor">
                  <SelectValue placeholder="rez" />
                </SelectTrigger>
                <SelectContent>
                  {["sous-sol", "rez", "1", "2", "3", "4", "5+"].map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-3">
              <Label htmlFor="startDate">Début bail</Label>
              <Input
                id="startDate"
                type="date"
                value={v.startDate ?? ""}
                onChange={(e) => set({ startDate: e.target.value })}
              />
            </div>

            <div className="md:col-span-3">
              <Label htmlFor="endDate">Fin bail</Label>
              <Input
                id="endDate"
                type="date"
                value={v.endDate ?? ""}
                onChange={(e) => set({ endDate: e.target.value })}
              />
            </div>

            <div className="md:col-span-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="legalBase">Base légale</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {suggestedBase ?? "—"}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={resetAutoBase} className="h-7 px-2">
                    Auto
                  </Button>
                </div>
              </div>
              <Select
                value={v.legalBase ?? ""}
                onValueChange={(s) => onManualBaseChange(s as LawBase)}
              >
                <SelectTrigger id="legalBase">
                  <SelectValue placeholder="Sélectionner…" />
                </SelectTrigger>
                <SelectContent>
                  {["LC.53", "LC.65", "LC.75", "LC.2007", "RC.47", "RC.53", "RC.65"].map((b) => (
                    <SelectItem key={b} value={b as LawBase}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 flex items-end gap-3">
              <div className="space-y-2">
                <Label htmlFor="lpg">LPG</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    id="lpg"
                    checked={!!v.lpg}
                    onCheckedChange={(c) => set({ lpg: !!c })}
                  />
                  <span className="text-sm text-slate-600">{v.lpg ? "Oui" : "Non"}</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-3">
              <Label htmlFor="building">Immeuble</Label>
              <Input
                id="building"
                value={v.building ?? ""}
                onChange={(e) => set({ building: e.target.value })}
                placeholder="6"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={onModifyDates} className="gap-2">
              <Calendar className="h-4 w-4" />
              Modification date bail
            </Button>
          </div>
        </section>

        <Separator />

        {/* ───── Section: Loyers & Aides ───── */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Banknote className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-semibold tracking-wide text-slate-700">
              Loyers & aides
            </h3>
          </div>

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
              <div className="flex items-center justify-between">
                <Label htmlFor="rentLoweredMonthly">Abaissé</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="text-xs text-slate-500 underline">
                      i
                    </TooltipTrigger>
                    <TooltipContent>Net abaissé (réduction exceptionnelle)</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <MoneyInput
                id="rentLoweredMonthly"
                value={v.rentLoweredMonthly}
                onChange={(n) => set({ rentLoweredMonthly: n })}
              />
            </div>

            <div className="md:col-span-3">
              <Label htmlFor="annualNet">Loyer annuel net</Label>
              <Input id="annualNet" readOnly value={CHF(annualNet)} className="bg-slate-100" />
            </div>

            <div className="md:col-span-3">
              <Label htmlFor="chargesMonthly">Charges</Label>
              <MoneyInput
                id="chargesMonthly"
                value={v.chargesMonthly}
                onChange={(n) => set({ chargesMonthly: n })}
              />
            </div>

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

          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={onModifyRent} className="gap-2">
              <Calculator className="h-4 w-4" />
              Modification loyer / montant bail
            </Button>
          </div>
        </section>

        <Separator />

        {/* ───── Section: Résiliation ───── */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-semibold tracking-wide text-slate-700">
              Résiliation
            </h3>
          </div>

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

            <div className="md:col-span-3">
              <Label htmlFor="terminationVisa">Visa</Label>
              <Select
                value={v.terminationVisa ?? "Ordinaire"}
                onValueChange={(s) => set({ terminationVisa: s as LeaseValue["terminationVisa"] })}
              >
                <SelectTrigger id="terminationVisa">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Ordinaire", "Extraordinaire", "Pour sous-occupation", "Autre"].map((opt) => (
                    <SelectItem key={opt} value={opt as any}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Label htmlFor="terminationEffective">Résiliation effective</Label>
              <div className="flex items-center gap-2 h-10">
                <Switch
                  id="terminationEffective"
                  checked={!!v.terminationEffective}
                  onCheckedChange={(c) => set({ terminationEffective: !!c })}
                />
                <span className="text-sm text-slate-600">
                  {v.terminationEffective ? "Oui" : "Non"}
                </span>
              </div>
            </div>

            <div className="md:col-span-3">
              <Label htmlFor="overrunPercent">Dépassement (en %)</Label>
              <div className="relative">
                <Input
                  id="overrunPercent"
                  value={v.overrunPercent ?? ""}
                  onChange={(e) => set({ overrunPercent: parseNumber(e.target.value) })}
                  inputMode="decimal"
                />
                <Percent className="absolute right-2 top-2.5 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div className="md:col-span-3">
              <Label htmlFor="newSupplement">Nouveau supplément</Label>
              <MoneyInput
                id="newSupplement"
                value={v.newSupplement}
                onChange={(n) => set({ newSupplement: n })}
              />
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
                      arr[i] = parseNumber(e.target.value) ?? 0;
                      set({ as1p: arr as [number, number, number, number] });
                    }}
                    inputMode="numeric"
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="destructive" onClick={onTerminateLease} className="gap-2">
              <FileSignature className="h-4 w-4" />
              Résiliation du bail
            </Button>
          </div>
        </section>

        <Separator />

        {/* ───── Section: Régie ───── */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Factory className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-semibold tracking-wide text-slate-700">Régie</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-4">
              <Label htmlFor="agencyName">Régie</Label>
              <Input
                id="agencyName"
                value={v.agency?.name ?? ""}
                onChange={(e) => set({ agency: { ...(v.agency ?? {}), name: e.target.value } })}
                placeholder="CPCL"
              />
            </div>
            <div className="md:col-span-4">
              <Label htmlFor="agencyPhone">Tél</Label>
              <Input
                id="agencyPhone"
                value={v.agency?.phone ?? ""}
                onChange={(e) => set({ agency: { ...(v.agency ?? {}), phone: e.target.value } })}
                placeholder="021 315 24 70"
              />
            </div>
            <div className="md:col-span-4">
              <Label htmlFor="agencyEmail">e-mail</Label>
              <Input
                id="agencyEmail"
                type="email"
                value={v.agency?.email ?? ""}
                onChange={(e) => set({ agency: { ...(v.agency ?? {}), email: e.target.value } })}
                placeholder="gerance@exemple.ch"
              />
            </div>

            <div className="md:col-span-8">
              <Label htmlFor="agencyAddress">Adresse</Label>
              <Input
                id="agencyAddress"
                value={v.agency?.address ?? ""}
                onChange={(e) => set({ agency: { ...(v.agency ?? {}), address: e.target.value } })}
                placeholder="Rue du Petit-Saint-Jean 4"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="agencyNpa">NPA</Label>
              <Input
                id="agencyNpa"
                value={v.agency?.npa ?? ""}
                onChange={(e) => set({ agency: { ...(v.agency ?? {}), npa: e.target.value } })}
                placeholder="1003"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="agencyCity">Localité</Label>
              <Input
                id="agencyCity"
                value={v.agency?.city ?? ""}
                onChange={(e) => set({ agency: { ...(v.agency ?? {}), city: e.target.value } })}
                placeholder="Lausanne"
              />
            </div>
          </div>
        </section>
      </CardContent>
    </Card>
  );
};

export default LeaseCard;
