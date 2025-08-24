import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Download, Filter, RefreshCw, Calendar, TrendingUp, AlertTriangle, BarChart2, PieChart, LineChart as LineIcon, Info } from "lucide-react";
import {
  LineChart as RLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  Legend,
  ResponsiveContainer,
  BarChart as RBarChart,
  Bar,
} from "recharts";

/**
 * ReportsOCL — Statistiques de gestion (OCL Lausanne)
 * - Tailwind + shadcn/ui + Recharts
 * - Filtres, KPIs, graphiques (lignes/barres), tableau pivot
 * - Données mock jan–août 2025
 */

// -------------------- Données mock --------------------
const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août"] as const;

const rawData = {
  Location: {
    Inscription: [264, 287, 300, 207, 248, 286, 246, 0],
    "Attestation sans limite": [132, 114, 102, 81, 87, 122, 175, 0],
    "Attestation avec limite": [125, 86, 108, 84, 89, 171, 143, 0],
    "Refus d'inscription": [27, 22, 20, 16, 19, 13, 26, 0],
    "Insertion logement libre": [30, 31, 44, 33, 36, 23, 38, 0],
    Autorisation: [89, 42, 99, 78, 43, 72, 53, 0],
    "Refus d'autorisation": [12, 9, 9, 6, 8, 11, 3, 0],
    Baux: [24, 40, 23, 35, 33, 21, 37, 0],
    Dérogation: [0, 4, 5, 1, 4, 2, 2, 0],
  },
  Révision: {
    Contrôle: [72, 253, 167, 112, 131, 251, 154, 0],
    "Conditions remplies": [51, 227, 119, 74, 111, 219, 128, 0],
    "Suppression des aides": [1, 2, 6, 3, 1, 5, 5, 0],
    Supplément: [9, 7, 12, 4, 5, 5, 3, 0],
    "Introduction des aides": [0, 0, 1, 0, 0, 1, 0, 0],
    "Résiliation SON": [7, 5, 8, 10, 8, 6, 8, 0],
    "Résiliation RTE": [6, 11, 25, 32, 11, 15, 10, 0],
    "Résiliation devoir d'information": [2, 2, 2, 0, 1, 0, 3, 0],
    Convention: [11, 10, 8, 2, 12, 4, 14, 0],
    "Audience en préfecture": [1, 5, 4, 2, 6, 7, 0, 0],
    "Recours/Réclamation": [1, 0, 3, 3, 1, 1, 0, 0],
  },
} as const;

type RawData = typeof rawData;
const categories = Object.keys(rawData) as Array<keyof RawData>;
const allActs = Object.entries(rawData).flatMap(([cat, acts]) =>
  Object.keys(acts).map((a) => ({ label: `${a}`, value: `${cat}::${a}` }))
);

// Agrégats utiles
function sum(arr: number[]) { return arr.reduce((a, b) => a + b, 0); }
function yoy(series: number[]) {
  // Pas de 2024 -> renvoie série vide pour maquette
  return series.map(() => null);
}
function mom(series: number[]) {
  return series.map((v, i, arr) => (i === 0 ? null : (arr[i] - arr[i - 1])));
}

// Transforme les séries en format Recharts {month, key1, key2, ...}
function toSeries(dataset: Record<string, (number | null)[]>, selected: string[]) {
  const rows: Array<Record<string, number | string | null>> = months.map((m) => ({ month: m }));
  selected.forEach((key) => {
    dataset[key].forEach((v, i) => (rows[i][key] = v));
  });
  return rows;
}

// Tableau pivot pour l'acte sélectionné ou top n
function buildPivot(cat: keyof RawData | "*", act: string | "*") {
  const res: Array<Record<string, number | string>> = [];
  const srcCats = cat === "*" ? (categories as Array<keyof RawData>) : [cat];
  srcCats.forEach((c) => {
    const acts = rawData[c];
    Object.keys(acts).forEach((a) => {
      if (act !== "*" && a !== act) return;
      const row: Record<string, number | string> = { catégorie: c, acte: a };
      months.forEach((m, i) => (row[m] = acts[a as keyof typeof acts][i] as number));
      row["Total"] = sum(acts[a as keyof typeof acts] as number[]);
      res.push(row);
    });
  });
  return res.sort((a, b) => (b["Total"] as number) - (a["Total"] as number));
}

export default function ReportsOCL() {
  // -------------------- États & filtres --------------------
  const [year, setYear] = useState("2025");
  const [category, setCategory] = useState<keyof RawData | "*">("*");
  const [act, setAct] = useState<string | "*">("*");
  const [metricMode, setMetricMode] = useState<"raw" | "mom" | "yoy">("raw");
  const [search, setSearch] = useState("");

  // Liste des actes selon filtre catégorie
  const actsForSelect = useMemo(() => {
    if (category === "*") return allActs;
    return Object.keys(rawData[category]).map((a) => ({ label: a, value: `${category}::${a}` }));
  }, [category]);

  // Choix de 3 séries par défaut pour les graphes
  const defaultKeys = useMemo(() => {
    if (category === "*") return ["Location::Inscription", "Révision::Contrôle", "Location::Autorisation"];
    const firstThree = Object.keys(rawData[category]).slice(0, 3);
    return firstThree.map((k) => `${category}::${k}`);
  }, [category]);

  // Préparer données pour courbes/barres
  const dataset = useMemo(() => {
    const sel = (category === "*"
      ? defaultKeys
      : defaultKeys.map((k) => (k.includes("::") ? k : `${category}::${k}`))
    ).map((full) => ({ cat: full.split("::")[0], key: full.split("::")[1] }));

    const byKey: Record<string, number[]> = {};
    sel.forEach(({ cat, key }) => {
      byKey[key] = (rawData as any)[cat][key];
    });

    // Appliquer le mode métrique
    const transformed: Record<string, (number | null)[]> = {};
    Object.entries(byKey).forEach(([k, series]) => {
      if (metricMode === "mom") transformed[k] = mom(series);
      else if (metricMode === "yoy") transformed[k] = yoy(series);
      else transformed[k] = series;
    });

    return toSeries(transformed, Object.keys(transformed));
  }, [category, defaultKeys, metricMode]);

  // KPI principaux
  const totals = useMemo(() => {
    const loc = Object.values(rawData.Location).reduce((acc, arr) => acc + sum(arr as number[]), 0);
    const rev = Object.values(rawData.Révision).reduce((acc, arr) => acc + sum(arr as number[]), 0);
    const refusIns = sum(rawData.Location["Refus d'inscription"]);
    const inscriptions = sum(rawData.Location["Inscription"]);
    const tauxRefus = inscriptions ? (refusIns / (inscriptions + refusIns)) * 100 : 0;
    return { loc, rev, tauxRefus: Number(tauxRefus.toFixed(1)), inscriptions };
  }, []);

  // Tableau pivot
  const tableData = useMemo(() => {
    const c = category === "*" ? "*" : category;
    const a = act === "*" ? "*" : act.split("::")[1];
    return buildPivot(c as any, a).filter((row) =>
      `${row.catégorie} ${row.acte}`.toLowerCase().includes(search.toLowerCase())
    );
  }, [category, act, search]);

  return (
    <TooltipProvider>
      <div className="w-full min-h-screen bg-background text-foreground p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Statistiques – Gestion (OCL Lausanne)</h1>
            <p className="text-sm text-muted-foreground">Suivi des volumes d'actes, tendances et répartition. Données jan–août {year} (démo).</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2"><RefreshCw className="h-4 w-4"/>Rafraîchir</Button>
            <Button className="gap-2"><Download className="h-4 w-4"/>Exporter PDF</Button>
          </div>
        </div>

        {/* Filtres */}
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>Année</Label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger><SelectValue placeholder="Année" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025">2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Catégorie</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as any)}>
                  <SelectTrigger><SelectValue placeholder="Toutes" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="*">Toutes</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Acte</Label>
                <Select value={act} onValueChange={(v) => setAct(v as any)}>
                  <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="*">Tous</SelectItem>
                    {actsForSelect.map((a) => (
                      <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Recherche</Label>
                <Input placeholder="Filtrer tableau (acte/catégorie)" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Location</CardTitle></CardHeader>
            <CardContent className="flex items-end justify-between"><div className="text-3xl font-semibold">{totals.loc.toLocaleString("fr-CH")}</div><BarChart2 className="h-6 w-6"/></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Révision</CardTitle></CardHeader>
            <CardContent className="flex items-end justify-between"><div className="text-3xl font-semibold">{totals.rev.toLocaleString("fr-CH")}</div><PieChart className="h-6 w-6"/></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Inscriptions</CardTitle></CardHeader>
            <CardContent className="flex items-end justify-between"><div className="text-3xl font-semibold">{totals.inscriptions.toLocaleString("fr-CH")}</div><LineIcon className="h-6 w-6"/></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center gap-2"><CardTitle className="text-sm text-muted-foreground">Taux refus inscription</CardTitle>
              <Tooltip><TooltipTrigger><Info className="h-4 w-4 text-muted-foreground"/></TooltipTrigger><TooltipContent>Refus / (Inscriptions + Refus) — démo.</TooltipContent></Tooltip>
            </CardHeader>
            <CardContent className="flex items-end justify-between"><div className="text-3xl font-semibold">{totals.tauxRefus}%</div><AlertTriangle className="h-6 w-6"/></CardContent>
          </Card>
        </div>

        {/* Graphiques */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Volumes mensuels – multi-séries</CardTitle>
              <p className="text-sm text-muted-foreground">Sélection automatique de 3 actes selon la catégorie.</p>
            </div>
            <Tabs value={metricMode} onValueChange={(v) => setMetricMode(v as any)}>
              <TabsList>
                <TabsTrigger value="raw" className="gap-1"><TrendingUp className="h-3 w-3"/>Brut</TabsTrigger>
                <TabsTrigger value="mom">MoM</TabsTrigger>
                <TabsTrigger value="yoy">YoY</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RLineChart data={dataset}>
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <RTooltip />
                  <Legend />
                  {Object.keys(dataset[0] || {}).filter((k) => k !== "month").slice(0, 3).map((k) => (
                    <Line key={k} type="monotone" dataKey={k} strokeWidth={2} dot={false} />
                  ))}
                </RLineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Répartition par catégorie (barres empilées)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RBarChart data={months.map((m, i) => ({
                  month: m,
                  Location: Object.values(rawData.Location).reduce((acc, arr) => acc + (arr as number[])[i], 0),
                  Révision: Object.values(rawData.Révision).reduce((acc, arr) => acc + (arr as number[])[i], 0),
                }))}>
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Legend />
                  <RTooltip />
                  <Bar dataKey="Location" stackId="a" />
                  <Bar dataKey="Révision" stackId="a" />
                </RBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tableau pivot */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Tableau détaillé (pivot)</CardTitle>
              <p className="text-sm text-muted-foreground">Totaux par acte, triés par volume (démo).</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Filter className="h-4 w-4"/>Filtres appliqués</div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm border rounded-lg overflow-hidden">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-2 w-40">Catégorie</th>
                  <th className="text-left p-2 w-72">Acte</th>
                  {months.map((m) => (
                    <th key={m} className="text-right p-2 min-w-[60px]">{m}</th>
                  ))}
                  <th className="text-right p-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-2 whitespace-nowrap">{row.catégorie as string}</td>
                    <td className="p-2 whitespace-nowrap">{row.acte as string}</td>
                    {months.map((m) => (
                      <td key={m} className="text-right p-2">{(row[m] as number)?.toLocaleString("fr-CH")}</td>
                    ))}
                    <td className="text-right p-2 font-medium">{(row["Total"] as number)?.toLocaleString("fr-CH")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Pied de page / glossaire */}
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <Calendar className="h-3 w-3"/>
          Données démo – dernière MàJ: aujourd'hui • Définitions: "Brut" = volumes mensuels. MoM = différence vs mois précédent. YoY = différence vs même mois N-1 (non calculé dans la démo).
        </div>
      </div>
    </TooltipProvider>
  );
}

export { ReportsOCL };