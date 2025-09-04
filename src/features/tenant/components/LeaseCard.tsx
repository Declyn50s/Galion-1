// LeaseCard.tsx
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
  Info,
} from "lucide-react";

// Données immeubles existantes (inchangé)
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
function streetCore(input: string): string {
  const s = U(input).replace(/[,.;]/g, " ");
  const parts = s.split(/\s+/).filter(Boolean);
  const kept = parts.filter(
    (w) => !TYPES.has(w) && !ARTICLES.has(w) && !/^\d+[A-Z]*$/.test(w)
  );
  return kept.join(" ").replace(/\s+/g, " ").trim();
}
function firstHouseNumber(input: string): number | null {
  const m = U(input).match(/(\d{1,5})/);
  return m ? parseInt(m[1], 10) : null;
}
type Range = [number, number];
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
function guessBaseFromImmeubles(userAdresse: string): LawBase | null {
  const core = streetCore(userAdresse);
  if (!core) return null;
  const n = firstHouseNumber(userAdresse);

  const rows = IMMEUBLES.filter((r) => streetCore(r.adresse) === core);
  if (rows.length === 0) return null;

  if (n == null) {
    return rows[0].base as LawBase;
  }

  for (const r of rows) {
    const ranges = rangesFromAdresse(r.adresse);
    if (ranges.some(([a, b]) => n >= a && n <= b)) return r.base as LawBase;
  }
  return rows[0].base as LawBase;
}
type LawGroup = "RC" | "LC.53" | "LC.65" | "LC.75" | "LC.2007" | "UNKNOWN";
function lawGroupFromBase(base?: string | null): LawGroup {
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
// Domaine métier : motifs / prolongations / règles

export type TerminationReason =
  | "SON_NOTOIRE"
  | "SOS_SIMPLE"
  | "RTE"
  | "DIF"
  | "SUR_OCCUPATION"
  | "AUTRE";

export type ProlongationType = "AUCUNE" | "CONVENTION" | "AUDIENCE";

type AidState = "maintenue" | "partielle" | "supprimée" | "non-applicable";

type RuleOutcome = {
  resiliation: boolean;
  supplementPercent?: number; // ex. 20 ou 50
  supplementNote?: string;
  supplementIsQuarterly?: boolean;
  aides: {
    cantonales: { etat: AidState; delaiMois?: number };
    communales: { etat: AidState; delaiMois?: number };
    AS: { etat: AidState; delaiMois?: number };
  };
  notes: string[];
};

// Exceptions
type Exceptions = {
  conciergePro60?: boolean;
  avsSeul3Pieces?: boolean;
};

// ─────────────────────────────────────────────────────────
// Règles métier condensées (basées sur ta procédure)

function computeRules(params: {
  lawGroup: LawGroup;
  reason?: TerminationReason;
  overrunPercent?: number; // dépassement RDU (%)
  sonIsNotoire?: boolean; // redondant si reason = SON_NOTOIRE
  exceptions?: Exceptions;
}): RuleOutcome {
  const { lawGroup, reason, overrunPercent = 0, sonIsNotoire, exceptions } = params;

  const OUT: RuleOutcome = {
    resiliation: false,
    supplementPercent: undefined,
    supplementNote: undefined,
    supplementIsQuarterly: true,
    aides: {
      cantonales: { etat: "non-applicable" },
      communales: { etat: "non-applicable" },
      AS: { etat: "non-applicable" },
    },
    notes: [],
  };

  const isRC = lawGroup === "RC" || lawGroup === "LC.53" || lawGroup === "LC.65"; // anciennes lois
  const isLC75 = lawGroup === "LC.75";
  const isLC2007 = lawGroup === "LC.2007";

  // Exceptions (directive 4 & 5)
  const conciergeTol40 = !!exceptions?.conciergePro60;
  const avsTol = !!exceptions?.avsSeul3Pieces;

  // DIF (devoir d'info) → décision de gestion (pas d'automatismes aides), possible résiliation si manquement grave
  if (reason === "DIF") {
    OUT.notes.push("DIF : manquement au devoir d’information (décision au cas par cas).");
    OUT.aides = {
      cantonales: { etat: "non-applicable" },
      communales: { etat: "non-applicable" },
      AS: { etat: "non-applicable" },
    };
    return OUT;
  }

  // SUR-OCCUPATION (2 unités de plus que nb pièces; enfants mineurs non comptés)
  if (reason === "SUR_OCCUPATION") {
    OUT.resiliation = true;
    OUT.notes.push("Sur-occupation : résiliation possible selon constat.");
    // aides : non spécifié comme supprimées d’office ⇒ pas de changement auto
    return OUT;
  }

  // SOS (simple / notoire)
  const isSON = reason === "SOS_SIMPLE" || reason === "SON_NOTOIRE" || sonIsNotoire;
  const notoire = reason === "SON_NOTOIRE" || !!sonIsNotoire;

  if (isSON) {
    if (isRC) {
      // Anciennes lois : pas d’aides C/C/AS
      OUT.aides = {
        cantonales: { etat: "non-applicable" },
        communales: { etat: "non-applicable" },
        AS: { etat: "non-applicable" },
      };
      OUT.supplementPercent = 20;
      OUT.supplementNote = "Supplément 20% du loyer net (trimestriel)";
      if (notoire) OUT.resiliation = true;
      OUT.notes.push("Anciennes lois : pas d’aides prévues; supplément 20%. SON notoire = résiliation.");
    } else if (isLC2007) {
      // Loi 2007 : SOS simple OK sans suppression ; SON notoire = résiliation + suppression aides
      OUT.supplementPercent = reason === "SOS_SIMPLE" ? undefined : undefined;
      if (notoire) {
        OUT.resiliation = true;
        OUT.aides = {
          cantonales: { etat: "supprimée", delaiMois: 6 },
          communales: { etat: "supprimée", delaiMois: 6 },
          AS: { etat: "supprimée", delaiMois: 1 },
        };
        OUT.notes.push("Loi 2007 : SON notoire → résiliation + suppression aides (C/C après 6 mois, AS immédiate).");
      } else {
        OUT.aides = {
          cantonales: { etat: "maintenue" },
          communales: { etat: "maintenue" },
          AS: { etat: "maintenue" },
        };
        OUT.notes.push("Loi 2007 : SOS simple → aides maintenues.");
      }
    } else if (isLC75) {
      // Loi 75 : SOS simple = suppression aides ; SON notoire = résiliation + suppression aides
      if (notoire) OUT.resiliation = true;
      OUT.aides = {
        cantonales: { etat: "supprimée", delaiMois: notoire ? 0 : 0 },
        communales: { etat: "supprimée", delaiMois: notoire ? 0 : 0 },
        AS: { etat: notoire ? "supprimée" : "maintenue", delaiMois: notoire ? 0 : undefined },
      };
      OUT.notes.push(
        `Loi 75 : SON ${notoire ? "notoire → résiliation + suppression aides" : "simple → suppression aides (AS maintenue)"}`
      );
    }
    // Abaissements/AS1/AS2 (résumé) — affichage informatif seulement
    OUT.notes.push("AS : selon barème (AS1 maintenu; AS2 supprimé si SON notoire en L2007/L75).");
    return OUT;
  }

  // RTE (Revenus trop élevés)
  if (reason === "RTE") {
    const dep = overrunPercent;
    const seuil = conciergeTol40 ? 40 : 20; // concierge pro : tolérance 40%
    const depGT = dep > seuil;

    if (isRC) {
      // Anciennes lois :
      if (dep > 20) {
        OUT.resiliation = true;
        OUT.supplementPercent = 50;
        OUT.supplementNote = "Supplément 50% du loyer net (trimestriel) + résiliation";
        OUT.aides = {
          cantonales: { etat: "non-applicable" },
          communales: { etat: "non-applicable" },
          AS: { etat: "non-applicable" },
        };
        OUT.notes.push("RC : >20% → résiliation + supplément 50% (trimestriel).");
      } else if (dep > 0) {
        OUT.supplementPercent = 50;
        OUT.supplementNote = "Supplément 50% du loyer net (trimestriel)";
        OUT.aides = {
          cantonales: { etat: "non-applicable" },
          communales: { etat: "non-applicable" },
          AS: { etat: "non-applicable" },
        };
        OUT.notes.push("RC : ≤20% → supplément 50% (trimestriel).");
      }
    } else if (isLC75) {
      if (depGT) {
        OUT.resiliation = true;
        OUT.aides = {
          cantonales: { etat: "supprimée" },
          communales: { etat: "supprimée" },
          AS: { etat: "supprimée" },
        };
        OUT.notes.push(`Loi 75 : >${seuil}% → suppression totale aides + résiliation.`);
      } else if (dep > 0) {
        OUT.aides = {
          cantonales: { etat: "partielle" },
          communales: { etat: "partielle" },
          AS: { etat: "maintenue" },
        };
        OUT.notes.push("Loi 75 : ≤20% → suppression partielle/totale C/C progressive; AS maintenue.");
      }
    } else if (isLC2007) {
      if (depGT) {
        OUT.resiliation = true;
        OUT.aides = {
          cantonales: { etat: "supprimée", delaiMois: 6 },
          communales: { etat: "supprimée", delaiMois: 6 },
          AS: { etat: "supprimée", delaiMois: 1 },
        };
        OUT.notes.push(`Loi 2007 : >${seuil}% → suppression C/C après 6 mois + AS immédiate + résiliation.`);
      } else if (dep > 0) {
        OUT.aides = {
          cantonales: { etat: "maintenue" },
          communales: { etat: "maintenue" },
          AS: { etat: "maintenue" },
        };
        OUT.notes.push("Loi 2007 : ≤20% → aides maintenues (C/C/AS).");
      }
    }

    // Rappel RCOL art.25 (supplément < 120 CHF/an non perçu)
    OUT.notes.push("Art. 25 RCOL : pas de perception si supplément annuel < CHF 120.–.");
    // Directive 3 (résiliation si RDU > 20% du plafond) déjà couverte par cas >20%.
    return OUT;
  }

  // AUTRE → neutre par défaut
  OUT.notes.push("Motif 'Autre' : évaluer manuellement.");
  return OUT;
}

// ─────────────────────────────────────────────────────────
// Types du composant

export type LeaseValue = {
  startDate?: string;
  endDate?: string;
  legalBase?: LawBase; // détectée automatiquement si adresse fournie
  lpg?: boolean;
  building?: string | number;
  address?: string;
  entry?: string | number;
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

  // 🔁 Remplacement : ancien "terminationVisa" → nouveau "terminationReason"
  terminationReason?: TerminationReason;
  prolongationType?: ProlongationType;
  terminationEffective?: boolean;
  terminationProlongationEnd?: string;

  overrunPercent?: number; // RDU dépassement %
  newSupplement?: number;

  as1p?: [number, number, number, number];

  // Exceptions
  conciergePro60?: boolean;
  avsSeul3Pieces?: boolean;

  agency?: {
    name?: string;
    phone?: string;
    address?: string;
    npa?: string;
    city?: string;
    email?: string;
  };

  // 🧯 rétrocompat : si des données anciennes existent
  terminationVisa?: "Ordinaire" | "Extraordinaire" | "Pour sous-occupation" | "Autre";
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

// ─────────────────────────────────────────────────────────

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
      legalBase: value?.legalBase,
      lpg: value?.lpg ?? false,
      floor: value?.floor ?? "rez",
      rooms: value?.rooms,
      rentNetMonthly: value?.rentNetMonthly,
      chargesMonthly: value?.chargesMonthly,
      bailRentAlone: value?.bailRentAlone,
      as1p: value?.as1p ?? [0, 0, 0, 0],
      prolongationType: value?.prolongationType ?? "AUCUNE",
      terminationReason: value?.terminationReason,
      conciergePro60: value?.conciergePro60 ?? false,
      avsSeul3Pieces: value?.avsSeul3Pieces ?? false,
      ...value,
    }),
    [value]
  );

  // Map rétrocompat "terminationVisa" → "terminationReason"
  React.useEffect(() => {
    if (v.terminationReason) return;
    if (!value?.terminationVisa) return;
    const map: Record<NonNullable<LeaseValue["terminationVisa"]>, TerminationReason> = {
      Ordinaire: "AUTRE",
      Extraordinaire: "AUTRE",
      "Pour sous-occupation": "SOS_SIMPLE",
      Autre: "AUTRE",
    };
    const guess = map[value.terminationVisa];
    if (guess) onChange?.({ ...v, terminationReason: guess });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (patch: Partial<LeaseValue>) => onChange?.({ ...v, ...patch });

  // ===== Détection auto de la base depuis l'adresse du bail =====
  const combinedAdresse = React.useMemo(
    () => [v.address, v.entry].filter(Boolean).join(" ").trim(),
    [v.address, v.entry]
  );

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

  // Règles automatiques
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

  // Supplément auto (sauf si saisi manuellement)
  const autoSupplementMonthly = React.useMemo(() => {
    if (!outcome.supplementPercent) return undefined;
    const pct = outcome.supplementPercent / 100;
    const s = Math.round(net * pct);
    // RCOL art.25 : si annuel < 120, pas perçu
    const annual = s * 12;
    if (annual < 120) return 0;
    return s;
  }, [outcome.supplementPercent, net]);

  // Si l’utilisateur saisit manuellement un supplément, on l’affiche tel quel; sinon calcul auto
  const effectiveSupplement = v.newSupplement ?? autoSupplementMonthly ?? 0;

  // Aides affichées (état + délai)
  const aidBadge = (label: string, s: { etat: AidState; delaiMois?: number }) => {
    const color =
      s.etat === "supprimée"
        ? "destructive"
        : s.etat === "partielle"
        ? "secondary"
        : s.etat === "maintenue"
        ? "default"
        : "outline";
    const txt =
      s.delaiMois && s.delaiMois > 0 ? `${label}: ${s.etat} (${s.delaiMois} mois)` : `${label}: ${s.etat}`;
    return (
      <Badge key={label} variant={color as any}>
        {txt}
      </Badge>
    );
  };

  // ─────────────────────────────────────────────────────────
  // Rendu

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
                    <SelectItem key={b} value={b}>
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

            <div className="md:col-span-4">
              <Label htmlFor="terminationReason">Motif (métier)</Label>
              <Select
                value={v.terminationReason ?? ""}
                onValueChange={(s) => set({ terminationReason: s as TerminationReason })}
              >
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
              <Select
                value={v.prolongationType ?? "AUCUNE"}
                onValueChange={(s) => set({ prolongationType: s as ProlongationType })}
              >
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

            <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-12 gap-4">
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
                <Label>Exceptions</Label>
                <div className="flex items-center gap-4">
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

            <div className="md:col-span-12">
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
            </div>

            <div className="md:col-span-3">
              <Label htmlFor="newSupplement">Supplément mensuel (auto / manuel)</Label>
              <MoneyInput
                id="newSupplement"
                value={v.newSupplement ?? autoSupplementMonthly}
                onChange={(n) => set({ newSupplement: n })}
              />
              <p className="text-xs text-slate-500 mt-1">
                Auto: {outcome.supplementPercent ? `${outcome.supplementPercent}% du net` : "—"}&nbsp;
                {outcome.supplementNote ? `• ${outcome.supplementNote}` : ""}
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
