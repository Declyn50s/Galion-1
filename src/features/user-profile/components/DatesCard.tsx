// src/features/user-profile/components/DatesCard.tsx
import React, { useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileWarning } from "lucide-react";
import { computeBareme, rentLimitFromIncome, BaremeColumn } from "@/lib/bareme";

type Props = {
  registrationDate?: string;
  lastCertificateDate?: string;
  deadline?: string;

  /** Pièces sélectionnées (contrôlé par le parent) */
  maxRooms?: number;

  /** Loyer min calculé en amont (si dispo) — correspond à la limite pour RDU + colonne */
  minRent?: number;

  /** Comptages ménage (pour pré-sélection) */
  adultsCount?: number;              // 👈 nouveau
  countedMinors?: number;
  visitingChildrenCount?: number;    // 👈 nouveau

  /** Colonne de barème “finale” (incl. bonus DV) */
  baremeColumn: BaremeColumn;

  /** RDU annuel du ménage (CHF) — sert si minRent non fourni */
  rduForBareme?: number;

  /** Interdiction 1,5p :
   *  - si revenu mensuel > 1'500 (ou annuel > 18'000)
   *  - et/ou âge ≥ 25
   */
  applicantAgeYears?: number;
  monthlyIncomeCHF?: number;
  annualIncomeCHF?: number;

  /** Peut être absent → no-op */
  onChange?: (field: string, value: any) => void;

  className?: string;
};

/* -------- helpers -------- */
const isFiniteNumber = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n);

const fmtCHF = (amount?: number) =>
  isFiniteNumber(amount)
    ? `CHF ${amount.toLocaleString("fr-CH", { maximumFractionDigits: 0 })}`
    : "—";

/** Renvoie la valeur “standardisée” en pas de 1.0 (1.5, 2.5, 3.5, 4.5, 5.5) */
const stepUp = (rooms: number): number => {
  const allowed = [1.5, 2.5, 3.5, 4.5, 5.5];
  for (let i = 0; i < allowed.length; i++) {
    if (rooms <= allowed[i]) return allowed[i];
  }
  return 5.5;
};

const DatesCard: React.FC<Props> = ({
  registrationDate,
  lastCertificateDate,
  deadline,
  maxRooms,
  minRent,

  adultsCount = 1,             // défaut robuste
  countedMinors = 0,
  visitingChildrenCount = 0,

  baremeColumn,
  rduForBareme,

  applicantAgeYears,
  monthlyIncomeCHF,
  annualIncomeCHF,

  onChange,
  className = "",
}) => {
  // ✅ wrapper sûr
  const change = React.useCallback(
    (field: string, value: any) => {
      if (typeof onChange === "function") onChange(field, value);
    },
    [onChange]
  );

  // 1) Colonne du barème : fournie par le parent
  const col = baremeColumn;

  // 2) Loyer min effectif : prop > calcul (RDU + col) > undefined
  const effectiveMinRent = useMemo(() => {
    if (isFiniteNumber(minRent)) return minRent;
    if (isFiniteNumber(rduForBareme) && rduForBareme > 0) {
      return rentLimitFromIncome(rduForBareme, col);
    }
    return undefined;
  }, [minRent, rduForBareme, col]);

  // 3) Infos barème (tranches) pour l’UI
  const bar = useMemo(() => {
    if (!isFiniteNumber(effectiveMinRent) || effectiveMinRent <= 0) return null;
    return computeBareme(effectiveMinRent, col);
  }, [effectiveMinRent, col]);

  // 4) Règles plafonds de refus (affichage)
  const maxAllowedRent = useMemo(() => {
    if (!isFiniteNumber(maxRooms)) return undefined;
    if (maxRooms === 2.5) return 1382;
    if (maxRooms === 3.5) return 1508;
    if (maxRooms >= 4) return 2062; // 4,5 et 5,5
    return undefined; // pas de règle explicite pour 1,5
  }, [maxRooms]);

  const roomsCategoryLabel = useMemo(() => {
    if (!isFiniteNumber(maxRooms)) return "";
    if (maxRooms === 2.5) return "2,5 pièces";
    if (maxRooms === 3.5) return "3,5 pièces";
    if (maxRooms >= 4) return "≥ 4,5 pièces";
    return "";
  }, [maxRooms]);

  const isRefusal =
    isFiniteNumber(effectiveMinRent) &&
    isFiniteNumber(maxAllowedRent) &&
    effectiveMinRent > maxAllowedRent;

  // 5) Interdiction 1,5p (âge/revenu)
  const incomeMonthly = useMemo(() => {
    if (isFiniteNumber(monthlyIncomeCHF)) return monthlyIncomeCHF;
    const annual = isFiniteNumber(annualIncomeCHF)
      ? annualIncomeCHF
      : isFiniteNumber(rduForBareme)
      ? rduForBareme
      : undefined;
    return isFiniteNumber(annual) ? annual / 12 : undefined;
  }, [monthlyIncomeCHF, annualIncomeCHF, rduForBareme]);

  const tooHighIncome = isFiniteNumber(incomeMonthly) && incomeMonthly > 1500;
  const is25OrMore =
    isFiniteNumber(applicantAgeYears) && applicantAgeYears >= 25;
  const forbid15 = !!(tooHighIncome || is25OrMore);

// 6) PRÉ-SÉLECTION AUTOMATIQUE selon règles ménage (+1 pièce sous conditions DV)
const autoRooms = useMemo<number>(() => {
  const A = Math.max(0, Math.floor(adultsCount));
  const K = Math.max(0, Math.floor(countedMinors));
  const dv = Math.max(0, Math.floor(visitingChildrenCount));

  let base: number;

  if (A <= 1) {
    // Personne seule
    if (K === 0) {
      // Sans infos “étudiant/RI”, on applique l'interdiction 1,5p si nécessaire
      base = forbid15 ? 2.5 : 1.5;
    } else if (K === 1) base = 3.5;
    else if (K === 2) base = 4.5;
    else base = 5.5;
  } else {
    // Couple / ≥2 adultes
    if (K === 0 || K === 1) base = 3.5;
    else if (K === 2) base = 4.5;
    else base = 5.5;
  }

  // ✅ Bonus DV (+1) uniquement si :
  // - 1 adulte ET DV≥2
  // - OU (≥2 adultes ET K≥1 ET DV≥2)
  const dvEligible =
    dv >= 2 && (A === 1 || (A >= 2 && K >= 1));

  if (dvEligible) {
    base =
      base === 1.5 ? 2.5 :
      base === 2.5 ? 3.5 :
      base === 3.5 ? 4.5 :
      5.5; // borne max
  }

  return stepUp(base);
}, [adultsCount, countedMinors, visitingChildrenCount, forbid15]);

  // 7) Appliquer la pré-sélection SANS écraser un choix manuel
  const prevAutoRef = React.useRef<number | undefined>(undefined);
  useEffect(() => {
    const prevAuto = prevAutoRef.current;
    const current = maxRooms;

    // Maj si aucune valeur choisie, ou si l’utilisateur n’a pas changé depuis la dernière auto
    const shouldApply =
      !isFiniteNumber(current) || (isFiniteNumber(prevAuto) && current === prevAuto);

    if (shouldApply && current !== autoRooms) {
      change("maxRooms", autoRooms);
    }

    prevAutoRef.current = autoRooms;
  }, [autoRooms, maxRooms, change]);

  return (
    <Card className={`border bg-white shadow-sm ${className}`}>
      <CardHeader className="py-2 px-3">
        <CardTitle className="text-[13px] font-medium">📅 Dates</CardTitle>
      </CardHeader>

      <CardContent className="px-3 pb-3">
        {/* Ligne 1 : 3 dates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Field label="Inscription">
            <Input
              type="date"
              value={registrationDate || ""}
              onChange={(e) => change("registrationDate", e.target.value)}
              className="h-8 text-xs"
            />
          </Field>

          <Field label="Attestation">
            <Input
              type="date"
              value={lastCertificateDate || ""}
              onChange={(e) => change("lastCertificateDate", e.target.value)}
              className="h-8 text-xs"
            />
          </Field>

          <Field label="Échéance">
            <Input
              type="date"
              value={deadline || ""}
              onChange={(e) => change("deadline", e.target.value)}
              className="h-8 text-xs"
            />
          </Field>
        </div>

        {/* Ligne 2 : pièces + loyer min */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
          <Field label="Pièces max">
            <div>
              <Select
                value={isFiniteNumber(maxRooms) ? String(maxRooms) : ""}
                onValueChange={(v) =>
                  change("maxRooms", v ? Number(v) : undefined)
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1.5" disabled={forbid15}>
                    1,5
                  </SelectItem>
                  <SelectItem value="2.5">2,5</SelectItem>
                  <SelectItem value="3.5">3,5</SelectItem>
                  <SelectItem value="4.5">4,5</SelectItem>
                  <SelectItem value="5.5">5,5</SelectItem>
                </SelectContent>
              </Select>
              {/* Info pré-sélection dynamique */}
              <p className="mt-1 text-[11px] text-slate-600">
                Pré-sélection : <strong>{String(autoRooms).replace(".", ",")} pièce(s)</strong> (règles ménage).
              </p>
            </div>
          </Field>

          <Field label={`Loyer min (limite) • Col. ${col}`}>
            <div>
              <Input
                readOnly
                value={fmtCHF(effectiveMinRent)}
                className="h-8 text-xs bg-slate-100 cursor-not-allowed"
              />
              {bar && (
                <p className="mt-1 text-[11px] leading-tight text-slate-600">
                  Tranche loyer {fmtCHF(bar?.rentRange?.min)} —{" "}
                  {fmtCHF(bar?.rentRange?.max)} • RDU admissible{" "}
                  {fmtCHF(bar?.incomeRange?.min)} —{" "}
                  {fmtCHF(bar?.incomeRange?.max)}
                  {typeof countedMinors === "number" && (
                    <> • Enfants comptés: {countedMinors}</>
                  )}
                </p>
              )}
            </div>
          </Field>
        </div>

        {/* Notification de refus */}
        {isRefusal && (
          <Alert className="mt-3 border-red-200 bg-red-50">
            <FileWarning className="h-4 w-4" />
            <AlertDescription className="text-[12px]">
              <span className="font-medium">
                Refus — loyer minimum trop élevé.
              </span>{" "}
              Pour <span className="font-medium">{roomsCategoryLabel}</span>, la
              limite maximale est{" "}
              <span className="font-medium">{fmtCHF(maxAllowedRent)}</span>, or
              le loyer minimum calculé est{" "}
              <span className="font-medium">{fmtCHF(effectiveMinRent)}</span>.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div className="space-y-1">
    <Label className="text-[11px] text-slate-600">{label}</Label>
    {children}
  </div>
);

export default DatesCard;
