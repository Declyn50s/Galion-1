// src/features/tenant/components/lease/BailCard.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileSignature, MapPin } from "lucide-react";
import { guessBaseFromImmeubles, lawGroupFromBase } from "./utils";
import type { LawBase, LeaseCardCommonProps, OnClicks, LeaseValue } from "./types";

const BailCard: React.FC<LeaseCardCommonProps & OnClicks> = ({
  value,
  onChange,
  onModifyDates,
  className,
}) => {
  const v: LeaseValue = React.useMemo(
    () => ({
      floor: value?.floor ?? "rez",
      prolongationType: value?.prolongationType ?? "AUCUNE",
      lpg: !!value?.lpg,
      ...value,
    }),
    [value]
  );

  // rétrocompat (si jamais)
  React.useEffect(() => {
    if (v.terminationReason || !value?.terminationVisa) return;
    const map: Record<NonNullable<LeaseValue["terminationVisa"]>, NonNullable<LeaseValue["terminationReason"]>> = {
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
    if (base && base !== v.legalBase) set({ legalBase: base });
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

  const lawGroup = lawGroupFromBase(v.legalBase);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <FileSignature className="h-5 w-5" />
          Bail
        </CardTitle>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="secondary">Régime&nbsp;: {lawGroup === "RC" ? "RC" : v.legalBase ?? "—"}</Badge>
          {v.rooms && <Badge variant="outline">{v.rooms} pièce(s)</Badge>}
          {v.floor && <Badge variant="outline">{String(v.floor).toUpperCase()}</Badge>}
          {typeof v.entry !== "undefined" && v.entry !== "" && (
            <Badge variant="outline">Entrée {String(v.entry)}</Badge>
          )}
          <Badge variant={suggestedBase ? "outline" : "destructive"}>
            {suggestedBase ? `Base détectée: ${suggestedBase}` : "Adresse non trouvée"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
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
            <Input id="entry" value={v.entry ?? ""} onChange={(e) => set({ entry: e.target.value })} placeholder="9" />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="apt">Appartement</Label>
            <Input id="apt" value={v.aptNumber ?? ""} onChange={(e) => set({ aptNumber: e.target.value })} placeholder="902" />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="rooms">Pièces</Label>
            <Select value={String(v.rooms ?? "")} onValueChange={(s) => set({ rooms: Number(s) })}>
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
            <Input id="startDate" type="date" value={v.startDate ?? ""} onChange={(e) => set({ startDate: e.target.value })} />
          </div>

          <div className="md:col-span-3">
            <Label htmlFor="endDate">Fin bail</Label>
            <Input id="endDate" type="date" value={v.endDate ?? ""} onChange={(e) => set({ endDate: e.target.value })} />
          </div>

          <div className="md:col-span-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="legalBase">Base légale</Label>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{suggestedBase ?? "—"}</Badge>
                <Button variant="ghost" size="sm" onClick={resetAutoBase} className="h-7 px-2">Auto</Button>
              </div>
            </div>
            <Select value={v.legalBase ?? ""} onValueChange={(s) => onManualBaseChange(s as LawBase)}>
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
                <Switch id="lpg" checked={!!v.lpg} onCheckedChange={(c) => set({ lpg: !!c })} />
                <span className="text-sm text-slate-600">{v.lpg ? "Oui" : "Non"}</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-3">
            <Label htmlFor="building">Immeuble</Label>
            <Input id="building" value={v.building ?? ""} onChange={(e) => set({ building: e.target.value })} placeholder="6" />
          </div>
        </div>

        <div className="mt-2">
          <Button variant="outline" onClick={onModifyDates} className="gap-2">
            <Calendar className="h-4 w-4" />
            Modification date bail
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BailCard;
