// src/features/tenant/components/lease/BailCard.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  FileSignature,
  MapPin,
  Home,
  IdCard,
  Building2,
} from "lucide-react";
import { guessBaseFromImmeubles, lawGroupFromBase } from "./utils";
import type {
  LawBase,
  LeaseCardCommonProps,
  OnClicks,
  LeaseValue,
  UnitStatus,
  LeaseStatus,
} from "./types";

const BailCard: React.FC<LeaseCardCommonProps & OnClicks> = ({
  value,
  onChange,
  onModifyDates,
  className,
}) => {
  const v: LeaseValue = React.useMemo(
    () => ({
      floor: value?.floor ?? "rez",
      prolongationType: (value as any)?.prolongationType ?? "AUCUNE",
      lpg: !!value?.lpg,
      ...value,
    }),
    [value]
  );

  // rétrocompat (si jamais)
  React.useEffect(() => {
    if ((v as any).terminationReason || !value?.terminationVisa) return;
    const map: Record<
      NonNullable<LeaseValue["terminationVisa"]>,
      NonNullable<
        (LeaseValue & { terminationReason?: string })["terminationReason"]
      >
    > = {
      Ordinaire: "AUTRE",
      Extraordinaire: "AUTRE",
      "Pour sous-occupation": "SOS_SIMPLE",
      Autre: "AUTRE",
    } as const;
    const guess = map[value.terminationVisa as keyof typeof map];
    if (guess) onChange?.({ ...v, terminationReason: guess } as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (patch: Partial<LeaseValue>) => onChange?.({ ...v, ...patch });

  // Adresse combinée pour auto-détection
  const combinedAdresse = React.useMemo(
    () =>
      [v.address, v.streetNumber, v.entry, v.zip, v.city]
        .filter(Boolean)
        .join(" ")
        .trim(),
    [v.address, v.streetNumber, v.entry, v.zip, v.city]
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

  // Helpers
  const parseDecimal = (s: string) => {
    const n = Number(String(s).replace(",", "."));
    return Number.isFinite(n) ? n : undefined;
  };

  const statusBadgeVariant = (status?: UnitStatus) => {
    switch (status) {
      case "DISPONIBLE":
        return "secondary" as const;
      case "SUSPENDU":
        return "outline" as const;
      case "OCCUPE":
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <FileSignature className="h-5 w-5" />
          Bail
        </CardTitle>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="secondary">
            Régime&nbsp;: {lawGroup === "RC" ? "RC" : v.legalBase ?? "—"}
          </Badge>

          {v.unitStatus && (
            <Badge variant={statusBadgeVariant(v.unitStatus)}>
              Logement&nbsp;: {v.unitStatus}
            </Badge>
          )}

          {v.leaseStatus && (
            <Badge variant="outline">Bail&nbsp;: {v.leaseStatus}</Badge>
          )}

          {v.rooms != null && (
            <Badge variant="outline">
              {String(v.rooms).replace(".", ",")}&nbsp;pièce(s)
            </Badge>
          )}

          {v.surface != null && <Badge variant="outline">{v.surface} m²</Badge>}

          {v.floor && (
            <Badge variant="outline">{String(v.floor).toUpperCase()}</Badge>
          )}

          {typeof v.entry !== "undefined" && v.entry !== "" && (
            <Badge variant="outline">Entrée {String(v.entry)}</Badge>
          )}

          {(v.zip || v.city) && (
            <Badge variant="outline">
              {v.zip ?? "—"}&nbsp;{v.city ?? ""}
            </Badge>
          )}

          <Badge variant={suggestedBase ? "outline" : "destructive"}>
            {suggestedBase
              ? `Base détectée: ${suggestedBase}`
              : "Adresse non trouvée"}
          </Badge>

          {manualBaseRef.current && (
            <Badge variant="secondary">Base: manuel</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Identification / Statuts */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-3">
            <Label htmlFor="unitStatus">Statut logement</Label>
            <Select
              value={v.unitStatus ?? ""}
              onValueChange={(s) => set({ unitStatus: s as UnitStatus })}
            >
              <SelectTrigger id="unitStatus">
                <SelectValue placeholder="Choisir…" />
              </SelectTrigger>
              <SelectContent>
                {["OCCUPE", "DISPONIBLE", "SUSPENDU"].map((x) => (
                  <SelectItem key={x} value={x}>
                    {x}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-3">
            <Label htmlFor="leaseStatus">Statut bail</Label>
            <Select
              value={v.leaseStatus ?? ""}
              onValueChange={(s) => set({ leaseStatus: s as LeaseStatus })}
            >
              <SelectTrigger id="leaseStatus">
                <SelectValue placeholder="Choisir…" />
              </SelectTrigger>
              <SelectContent>
                {["ACTIF", "RESILIE", "SUSPENDU", "EN_CREATION"].map((x) => (
                  <SelectItem key={x} value={x}>
                    {x}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-3">
            <Label htmlFor="hestia">Numéro Hestia</Label>
            <div className="relative">
              <IdCard className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                id="hestia"
                className="pl-7"
                value={v.hestiaNumber ?? ""}
                onChange={(e) => set({ hestiaNumber: e.target.value })}
                placeholder="5021.0"
              />
            </div>
          </div>

          <div className="md:col-span-3">
            <Label htmlFor="building">N° immeuble</Label>
            <div className="relative">
              <Building2 className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                id="building"
                className="pl-7"
                value={v.building ?? ""}
                onChange={(e) => set({ building: e.target.value })}
                placeholder="83"
              />
            </div>
          </div>
        </div>

        {/* Identifiants externes */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-3">
            <Label htmlFor="edid">EDID</Label>
            <Input
              id="edid"
              value={v.edid ?? ""}
              onChange={(e) => set({ edid: e.target.value })}
            />
          </div>
          <div className="md:col-span-3">
            <Label htmlFor="ewid">EWID</Label>
            <Input
              id="ewid"
              value={v.ewid ?? ""}
              onChange={(e) => set({ ewid: e.target.value })}
            />
          </div>
          <div className="md:col-span-3">
            <Label htmlFor="aptNumber">N° logement (Appartement)</Label>
            <Input
              id="aptNumber"
              value={v.aptNumber ?? ""}
              onChange={(e) => set({ aptNumber: e.target.value })}
              placeholder="141"
            />
          </div>
          <div className="md:col-span-3">
            <Label htmlFor="manager">Gérance</Label>
            <Input
              id="manager"
              value={v.manager ?? ""}
              onChange={(e) => set({ manager: e.target.value })}
              placeholder="BRAUN SA"
            />
          </div>
        </div>

        {/* Adresse détaillée */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-4">
            <Label htmlFor="address">Rue</Label>
            <div className="relative">
              <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                id="address"
                className="pl-7"
                value={v.address ?? ""}
                onChange={(e) => set({ address: e.target.value })}
                placeholder='Ex: "MALLEY"'
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="streetNumber">Numéro</Label>
            <Input
              id="streetNumber"
              value={v.streetNumber ?? ""}
              onChange={(e) => set({ streetNumber: e.target.value })}
              placeholder="1"
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="entry">Entrée / cage</Label>
            <Input
              id="entry"
              value={v.entry ?? ""}
              onChange={(e) => set({ entry: e.target.value })}
              placeholder="9"
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="zip">NPA</Label>
            <Input
              id="zip"
              value={v.zip ?? ""}
              onChange={(e) => set({ zip: e.target.value })}
              placeholder="1007"
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="city">Localité</Label>
            <Input
              id="city"
              value={v.city ?? ""}
              onChange={(e) => set({ city: e.target.value })}
              placeholder="Lausanne"
            />
          </div>
        </div>

        {/* Caractéristiques */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="rooms">Pièces</Label>
            <Input
              id="rooms"
              inputMode="decimal"
              value={v.rooms ?? ""}
              onChange={(e) => set({ rooms: parseDecimal(e.target.value) })}
              placeholder="3.00"
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="floor">Étage</Label>
            <Input
              id="floor"
              value={v.floor ?? ""}
              onChange={(e) => set({ floor: e.target.value })}
              placeholder="4"
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="surface">Surface (m²)</Label>
            <Input
              id="surface"
              inputMode="decimal"
              value={v.surface ?? ""}
              onChange={(e) => set({ surface: parseDecimal(e.target.value) })}
              placeholder="76.00"
            />
          </div>

          <div className="md:col-span-3">
            <Label htmlFor="owner">Propriétaire</Label>
            <Input
              id="owner"
              value={v.owner ?? ""}
              onChange={(e) => set({ owner: e.target.value })}
              placeholder="LE LOGEMENT IDEAL"
            />
          </div>

          <div className="md:col-span-3">
            <Label htmlFor="lpg">LPG</Label>
            <div className="flex items-center gap-2">
              <Switch
                id="lpg"
                checked={!!v.lpg}
                onCheckedChange={(c) => set({ lpg: !!c })}
              />
              <span className="text-sm text-slate-600">
                {v.lpg ? "Oui" : "Non"}
              </span>
            </div>
          </div>
        </div>

        {/* Base légale / dates bail */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="legalBase">Base légale</Label>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {suggestedBase ?? "—"}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetAutoBase}
                  className="h-7 px-2"
                >
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
                {[
                  "LC.53",
                  "LC.65",
                  "LC.75",
                  "LC.2007",
                  "RC.47",
                  "RC.53",
                  "RC.65",
                ].map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
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
        </div>

        {/* Dates clés (annonce/relocation/libération) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-3">
            <Label htmlFor="advertisedAt">Date annonce</Label>
            <Input
              id="advertisedAt"
              type="date"
              value={v.advertisedAt ?? ""}
              onChange={(e) => set({ advertisedAt: e.target.value })}
            />
          </div>
          <div className="md:col-span-3">
            <Label htmlFor="relocatedAt">Date relocation</Label>
            <Input
              id="relocatedAt"
              type="date"
              value={v.relocatedAt ?? ""}
              onChange={(e) => set({ relocatedAt: e.target.value })}
            />
          </div>
          <div className="md:col-span-3">
            <Label htmlFor="releasedAt">Date libération</Label>
            <Input
              id="releasedAt"
              type="date"
              value={v.releasedAt ?? ""}
              onChange={(e) => set({ releasedAt: e.target.value })}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={onModifyDates} className="gap-2">
            <Calendar className="h-4 w-4" />
            Modification date bail
          </Button>
          {(v.address || v.city) && (
            <Badge
              variant="outline"
              className="ml-auto flex items-center gap-1"
            >
              <Home className="h-3.5 w-3.5" />
              {v.address ?? "—"}
              {v.streetNumber ? ` ${v.streetNumber}` : ""}, {v.zip ?? "—"}{" "}
              {v.city ?? ""}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BailCard;