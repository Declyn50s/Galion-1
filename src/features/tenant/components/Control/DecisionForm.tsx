// radio/checkbox + justification + générer docs
// src/features/tenant/components/DecisionForm/DecisionForm.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export type LawKind = "LC.75" | "LC.2007" | "RC" | "UNKNOWN";
export type SonKind = "none" | "simple" | "notoire";
export type RteKind = "unknown" | "lte20" | "gt20";

/** Structure de sortie normalisée (ce que tu stockes/envoies) */
export type Decision = {
  law: LawKind;

  // Contexte de contrôle (trace)
  context: {
    son: SonKind;
    rte: RteKind;
    dif: boolean;
    adults: number;
    minors: number;
    rooms?: number;
    cap?: number;
    percentOverCap?: number;
  };

  // Actions décidées (peuvent être combinées)
  actions: {
    supplement?: {
      enabled: boolean;
      percent: number; // 20 / 50 / autre
      base: "net"; // pour l’instant on ne gère que net
      startDate?: string;
      endDate?: string;
      comment?: string;
    };
    suppressionAides?: {
      enabled: boolean;
      communal: boolean;
      cantonale: boolean;
      AS: boolean;
      startDate?: string;
      durationMonths?: number; // p.ex. 6 mois (LC.2007)
      comment?: string;
    };
    resiliation?: {
      enabled: boolean;
      reason:
        | "SON_SIMPLE"
        | "SON_NOTOIRE"
        | "RTE_GT20"
        | "DIF"
        | "AUTRE";
      noticeDate?: string; // date de notification
      leaveDate?: string; // date de libération/fin
      prolongationsAllowed?: 0 | 1 | 2;
      comment?: string;
    };
  };

  // Notifications / suivi
  notifications: {
    notifyTenant: boolean;
    notifyRegie: boolean;
    notifyPrefecture: boolean;
  };

  followup: {
    nextControlDate?: string; // date de prochain contrôle (selon fréquence)
  };

  // Texte final libre (pour PV/mémo/courrier)
  notes?: string;
};

export interface DecisionFormProps {
  // Contexte
  law: LawKind;
  adults: number;
  minors: number;
  rooms?: number;
  son: SonKind;
  rte: RteKind;
  dif?: boolean; // devoir d'information

  // Infos RTE calculées (optionnelles)
  cap?: number;
  percentOverCap?: number;

  // Valeurs par défaut (dates)
  defaultDates?: {
    notification?: string;
    leaveDate?: string;
    startDate?: string;
  };

  // Callbacks
  onSubmit: (decision: Decision) => void;
  onCancel?: () => void;

  // UI
  className?: string;
  title?: string;
}

/** Déduit une proposition d’actions en fonction des règles fournies par Derval */
function suggestFromRules(args: {
  law: LawKind;
  son: SonKind;
  rte: RteKind;
  dif?: boolean;
}) {
  const { law, son, rte, dif } = args;

  // Defaults
  let supplementEnabled = false;
  let supplementPercent = 0;

  let suppressionEnabled = false;
  let supComm = false;
  let supCant = false;
  let supAS = false;
  let supDuration = 0;

  let resEnabled = false;
  let resReason: Decision["actions"]["resiliation"]["reason"] = "AUTRE";

  // SON
  if (son === "simple") {
    if (law === "RC") {
      supplementEnabled = true;
      supplementPercent = 20; // RC: SON simple -> +20% net
    } else if (law === "LC.75") {
      suppressionEnabled = true; // LC.75 : suppression aides
      supComm = true;
      supCant = true;
    } else if (law === "LC.2007") {
      // Aides maintenues (pas d’action automatique)
    }
  } else if (son === "notoire") {
    resEnabled = true;
    resReason = "SON_NOTOIRE";
    if (law === "RC") {
      supplementEnabled = true;
      supplementPercent = 20; // RC: SON notoire -> résiliation + 20%
    }
    if (law === "LC.75" || law === "LC.2007") {
      suppressionEnabled = true; // + suppression aides
      supComm = true;
      supCant = true;
    }
  }

  // RTE
  if (rte === "lte20") {
    if (law === "RC") {
      supplementEnabled = true;
      supplementPercent = Math.max(supplementPercent, 50); // RC: +50% net
    } else if (law === "LC.75") {
      suppressionEnabled = true; // suppression partielle/totale (au cas par cas)
      supComm = true;
      supCant = true;
    } else if (law === "LC.2007") {
      // aides maintenues
    }
  } else if (rte === "gt20") {
    if (law === "RC") {
      supplementEnabled = true;
      supplementPercent = Math.max(supplementPercent, 50);
      resEnabled = true;
      resReason = "RTE_GT20"; // + résiliation
    } else if (law === "LC.75") {
      suppressionEnabled = true; // suppression totale + résiliation
      supComm = true;
      supCant = true;
      resEnabled = true;
      resReason = "RTE_GT20";
    } else if (law === "LC.2007") {
      suppressionEnabled = true; // sup. aides 6 mois + AS immédiate + résiliation
      supComm = true;
      supCant = true;
      supAS = true;
      supDuration = 6;
      resEnabled = true;
      resReason = "RTE_GT20";
    }
  }

  // DIF : peut justifier la résiliation
  if (dif) {
    resEnabled = true;
    resReason = resReason === "AUTRE" ? "DIF" : resReason;
  }

  // Si rien de tout ça → conforme (aucune action cochée)
  return {
    supplementEnabled,
    supplementPercent,
    suppressionEnabled,
    supComm,
    supCant,
    supAS,
    supDuration,
    resEnabled,
    resReason,
  };
}

const DecisionForm: React.FC<DecisionFormProps> = ({
  law,
  adults,
  minors,
  rooms,
  son,
  rte,
  dif = false,
  cap,
  percentOverCap,
  defaultDates,
  onSubmit,
  onCancel,
  className,
  title = "Décision suite au contrôle",
}) => {
  const suggestion = React.useMemo(
    () => suggestFromRules({ law, son, rte, dif }),
    [law, son, rte, dif]
  );

  // === State UI
  const [notes, setNotes] = React.useState<string>("");

  // Supplement
  const [suppEnabled, setSuppEnabled] = React.useState<boolean>(suggestion.supplementEnabled);
  const [suppPercent, setSuppPercent] = React.useState<number>(suggestion.supplementPercent || 20);
  const [suppStart, setSuppStart] = React.useState<string | undefined>(defaultDates?.startDate);
  const [suppEnd, setSuppEnd] = React.useState<string | undefined>();
  const [suppComment, setSuppComment] = React.useState<string>("");

  // Suppression aides
  const [saEnabled, setSaEnabled] = React.useState<boolean>(suggestion.suppressionEnabled);
  const [saComm, setSaComm] = React.useState<boolean>(suggestion.supComm);
  const [saCant, setSaCant] = React.useState<boolean>(suggestion.supCant);
  const [saAS, setSaAS] = React.useState<boolean>(suggestion.supAS);
  const [saStart, setSaStart] = React.useState<string | undefined>(defaultDates?.startDate);
  const [saDuration, setSaDuration] = React.useState<number>(suggestion.supDuration || 0);
  const [saComment, setSaComment] = React.useState<string>("");

  // Résiliation
  const [resEnabled, setResEnabled] = React.useState<boolean>(suggestion.resEnabled);
  const [resReason, setResReason] = React.useState<Decision["actions"]["resiliation"]["reason"]>(suggestion.resReason);
  const [resNotice, setResNotice] = React.useState<string | undefined>(defaultDates?.notification);
  const [resLeave, setResLeave] = React.useState<string | undefined>(defaultDates?.leaveDate);
  const [resProlong, setResProlong] = React.useState<0 | 1 | 2>(0);
  const [resComment, setResComment] = React.useState<string>("");

  // Notifications / suivi
  const [notifyTenant, setNotifyTenant] = React.useState(true);
  const [notifyRegie, setNotifyRegie] = React.useState(true);
  const [notifyPref, setNotifyPref] = React.useState(false);
  const [nextControlDate, setNextControlDate] = React.useState<string | undefined>();

  // === Helpers UI
  const Pill: React.FC<{ children: React.ReactNode; variant?: "default" | "outline" | "destructive" | "secondary" }> = ({
    children,
    variant = "outline",
  }) => <Badge variant={variant}>{children}</Badge>;

  const handleSubmit = () => {
    const decision: Decision = {
      law,
      context: {
        son,
        rte,
        dif,
        adults,
        minors,
        rooms,
        cap,
        percentOverCap,
      },
      actions: {
        supplement: suppEnabled
          ? {
              enabled: true,
              percent: suppPercent,
              base: "net",
              startDate: suppStart,
              endDate: suppEnd,
              comment: suppComment || undefined,
            }
          : undefined,
        suppressionAides: saEnabled
          ? {
              enabled: true,
              communal: saComm,
              cantonale: saCant,
              AS: saAS,
              startDate: saStart,
              durationMonths: saDuration || undefined,
              comment: saComment || undefined,
            }
          : undefined,
        resiliation: resEnabled
          ? {
              enabled: true,
              reason: resReason,
              noticeDate: resNotice,
              leaveDate: resLeave,
              prolongationsAllowed: resProlong,
              comment: resComment || undefined,
            }
          : undefined,
      },
      notifications: {
        notifyTenant,
        notifyRegie,
        notifyPrefecture: notifyPref,
      },
      followup: {
        nextControlDate: nextControlDate || undefined,
      },
      notes: notes || undefined,
    };

    onSubmit(decision);
  };

  // ——— UI ———
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <Pill>Régime&nbsp;: {law}</Pill>
          {typeof rooms === "number" && <Pill>{rooms} pièces</Pill>}
          <Pill>{adults} adulte(s)</Pill>
          <Pill>{minors} mineur(s)</Pill>
          {son !== "none" && (
            <Pill variant={son === "notoire" ? "destructive" : "secondary"}>
              SON&nbsp;: {son}
            </Pill>
          )}
          {rte !== "unknown" && (
            <Pill variant={rte === "gt20" ? "destructive" : "secondary"}>
              RTE&nbsp;: {rte === "lte20" ? "<20%" : "≥20%"}
            </Pill>
          )}
          {typeof cap === "number" && <Pill>CAP RDU&nbsp;: {cap.toLocaleString("fr-CH")}</Pill>}
          {typeof percentOverCap === "number" && percentOverCap > 0 && (
            <Pill variant={percentOverCap >= 20 ? "destructive" : "secondary"}>
              +{percentOverCap}%</Pill>
          )}
          {dif && <Pill variant="destructive">DIF</Pill>}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* SUPPLÉMENT LOYER */}
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <Checkbox id="suppEnabled" checked={suppEnabled} onCheckedChange={(v) => setSuppEnabled(!!v)} />
            <Label htmlFor="suppEnabled" className="text-sm font-medium">
              Supplément de loyer
            </Label>
            {suppEnabled && (
              <Badge variant="secondary" className="ml-2">
                {suppPercent}% du loyer net
              </Badge>
            )}
          </div>

          {suppEnabled && (
            <div className="grid gap-3 md:grid-cols-4">
              <div>
                <Label className="text-xs">Pourcentage</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={suppPercent}
                  onChange={(e) => setSuppPercent(Number(e.target.value || 0))}
                />
              </div>
              <div>
                <Label className="text-xs">Début</Label>
                <Input type="date" value={suppStart ?? ""} onChange={(e) => setSuppStart(e.target.value || undefined)} />
              </div>
              <div>
                <Label className="text-xs">Fin (option)</Label>
                <Input type="date" value={suppEnd ?? ""} onChange={(e) => setSuppEnd(e.target.value || undefined)} />
              </div>
              <div className="md:col-span-4">
                <Label className="text-xs">Commentaire</Label>
                <Textarea rows={2} value={suppComment} onChange={(e) => setSuppComment(e.target.value)} />
              </div>
            </div>
          )}
        </section>

        <Separator />

        {/* SUPPRESSION AIDES */}
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <Checkbox id="saEnabled" checked={saEnabled} onCheckedChange={(v) => setSaEnabled(!!v)} />
            <Label htmlFor="saEnabled" className="text-sm font-medium">
              Suppression des aides
            </Label>
            {saEnabled && (saComm || saCant || saAS) && (
              <div className="flex flex-wrap gap-2 ml-2">
                {saComm && <Badge variant="secondary">Communales</Badge>}
                {saCant && <Badge variant="secondary">Cantonales</Badge>}
                {saAS && <Badge variant="secondary">AS</Badge>}
              </div>
            )}
          </div>

          {saEnabled && (
            <div className="grid gap-3 md:grid-cols-4">
              <div className="flex items-center gap-2 md:col-span-2">
                <Checkbox id="saComm" checked={saComm} onCheckedChange={(v) => setSaComm(!!v)} />
                <Label htmlFor="saComm" className="text-xs">Communales</Label>
                <Checkbox id="saCant" className="ml-4" checked={saCant} onCheckedChange={(v) => setSaCant(!!v)} />
                <Label htmlFor="saCant" className="text-xs">Cantonales</Label>
                <Checkbox id="saAS" className="ml-4" checked={saAS} onCheckedChange={(v) => setSaAS(!!v)} />
                <Label htmlFor="saAS" className="text-xs">AS</Label>
              </div>

              <div>
                <Label className="text-xs">Début</Label>
                <Input type="date" value={saStart ?? ""} onChange={(e) => setSaStart(e.target.value || undefined)} />
              </div>

              <div>
                <Label className="text-xs">Durée (mois)</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={saDuration}
                  onChange={(e) => setSaDuration(Number(e.target.value || 0))}
                />
              </div>

              <div className="md:col-span-4">
                <Label className="text-xs">Commentaire</Label>
                <Textarea rows={2} value={saComment} onChange={(e) => setSaComment(e.target.value)} />
              </div>
            </div>
          )}
        </section>

        <Separator />

        {/* RÉSILIATION */}
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <Checkbox id="resEnabled" checked={resEnabled} onCheckedChange={(v) => setResEnabled(!!v)} />
            <Label htmlFor="resEnabled" className="text-sm font-medium">
              Résiliation du bail
            </Label>
            {resEnabled && <Badge variant="destructive" className="ml-2">Active</Badge>}
          </div>

          {resEnabled && (
            <div className="grid gap-3 md:grid-cols-4">
              <div className="md:col-span-2">
                <Label className="text-xs">Motif</Label>
                <Select value={resReason} onValueChange={(v: any) => setResReason(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SON_SIMPLE">SON — simple</SelectItem>
                    <SelectItem value="SON_NOTOIRE">SON — notoire</SelectItem>
                    <SelectItem value="RTE_GT20">RTE ≥ 20%</SelectItem>
                    <SelectItem value="DIF">DIF</SelectItem>
                    <SelectItem value="AUTRE">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Notification</Label>
                <Input type="date" value={resNotice ?? ""} onChange={(e) => setResNotice(e.target.value || undefined)} />
              </div>
              <div>
                <Label className="text-xs">Départ / fin</Label>
                <Input type="date" value={resLeave ?? ""} onChange={(e) => setResLeave(e.target.value || undefined)} />
              </div>

              <div className="md:col-span-4">
                <Label className="text-xs">Prolongations possibles</Label>
                <Select value={String(resProlong)} onValueChange={(v) => setResProlong(Number(v) as 0 | 1 | 2)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Aucune</SelectItem>
                    <SelectItem value="1">Une (convention régie/locataire)</SelectItem>
                    <SelectItem value="2">Deux (2e → Préfecture)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-4">
                <Label className="text-xs">Commentaire</Label>
                <Textarea rows={2} value={resComment} onChange={(e) => setResComment(e.target.value)} />
              </div>
            </div>
          )}
        </section>

        <Separator />

        {/* NOTIFICATIONS / SUIVI */}
        <section className="space-y-3">
          <div className="text-sm font-medium">Notifications</div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox id="nTen" checked={notifyTenant} onCheckedChange={(v) => setNotifyTenant(!!v)} />
              <Label htmlFor="nTen" className="text-xs">Notifier le locataire</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="nReg" checked={notifyRegie} onCheckedChange={(v) => setNotifyRegie(!!v)} />
              <Label htmlFor="nReg" className="text-xs">Notifier la gérance</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="nPref" checked={notifyPref} onCheckedChange={(v) => setNotifyPref(!!v)} />
              <Label htmlFor="nPref" className="text-xs">Informer la Préfecture</Label>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label className="text-xs">Prochain contrôle</Label>
              <Input
                type="date"
                value={nextControlDate ?? ""}
                onChange={(e) => setNextControlDate(e.target.value || undefined)}
              />
            </div>
            <div>
              <Label className="text-xs">Notes (PV / courrier)</Label>
              <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
        </section>

        {/* RÉSUMÉ RAPIDE */}
        <section className="space-y-2 border rounded-md p-3 bg-slate-50">
          <div className="text-xs font-semibold">Résumé</div>
          <ul className="text-xs list-disc pl-5 space-y-1 text-slate-700">
            {!suppEnabled && !saEnabled && !resEnabled && <li>Conforme — aucune mesure.</li>}
            {suppEnabled && <li>Supplément {suppPercent}% du loyer net {suppStart ? `dès ${suppStart}` : ""}{suppEnd ? `, jusqu’au ${suppEnd}` : ""}.</li>}
            {saEnabled && (
              <li>
                Suppression des aides {[
                  saComm ? "communales" : null,
                  saCant ? "cantonales" : null,
                  saAS ? "AS" : null,
                ].filter(Boolean).join(", ")}{saStart ? ` dès ${saStart}` : ""}{saDuration ? ` (durée ${saDuration} mois)` : ""}.
              </li>
            )}
            {resEnabled && (
              <li>
                Résiliation ({resReason.replace("_", " ")})
                {resNotice ? ` — notifiée le ${resNotice}` : ""}{resLeave ? ` — départ ${resLeave}` : ""}{resProlong ? ` — ${resProlong} prolongation(s) possible(s)` : ""}.
              </li>
            )}
            {notifyTenant && <li>Notification locataire.</li>}
            {notifyRegie && <li>Notification gérance.</li>}
            {notifyPref && <li>Information Préfecture.</li>}
            {nextControlDate && <li>Prochain contrôle : {nextControlDate}.</li>}
          </ul>
        </section>

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Annuler
            </Button>
          )}
          <Button onClick={handleSubmit}>Enregistrer la décision</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DecisionForm;
