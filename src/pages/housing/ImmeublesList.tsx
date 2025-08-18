// src/pages/housing/ImmeublesList.tsx
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Download, RefreshCw, ArrowUpDown, Pencil, Eye } from "lucide-react";

type Row = { sehl: number; adresse: string; base: string };
type SortKey = "sehl" | "adresse" | "base";
type SortDir = "asc" | "desc";

const DEFAULT_PAGE_SIZE = 25;

// ---------- Données ----------
const RAW_DATA: Row[] = [
  { sehl: 2, adresse: "ANCIEN-STAND 12-18", base: "LC.53" },
  { sehl: 3, adresse: "ANCIEN-STAND 20", base: "LC.53" },
  { sehl: 4, adresse: "ANCIEN-STAND 22-28", base: "LC.53" },
  { sehl: 5, adresse: "AOSTE 1-5", base: "LC.75" },
  { sehl: 6, adresse: "BERNE 9", base: "LC.75" },
  { sehl: 7, adresse: "BERNE 11", base: "RC.47" },
  { sehl: 8, adresse: "BERNE 13E", base: "LC.75" },
  { sehl: 9, adresse: "BOIS FONTAINE 8a10/13a19", base: "LC.75" },
  { sehl: 10, adresse: "BOIS-GENTIL 31-33", base: "LC.75" },
  { sehl: 11, adresse: "BOIS-GENTIL 142-144", base: "LC.53" },
  { sehl: 12, adresse: "BOIS-DE-VAUX 21-27", base: "LC.75" },
  { sehl: 13, adresse: "BOISSONNET 32", base: "LC.75" },
  { sehl: 14, adresse: "BOISSONNET 32", base: "LC.75" },
  { sehl: 15, adresse: "BOISSONNET 34-46", base: "LC.75" },
  { sehl: 16, adresse: "BON-ABRI 9-13", base: "LC.75" },
  { sehl: 17, adresse: "BORDE 12:14/ 16B-22B", base: "LC.75" },
  { sehl: 18, adresse: "BORDE 26-30", base: "LC.75" },
  { sehl: 19, adresse: "BORDE 32", base: "LC.75" },
  { sehl: 20, adresse: "BONNE ESPERANCE 32", base: "LC.2007" },
  { sehl: 21, adresse: "BORDE 44", base: "LC.75" },
  { sehl: 22, adresse: "BORDE 45-49", base: "LC.75" },
  { sehl: 23, adresse: "BORDE 51-57", base: "LC.75" },
  { sehl: 24, adresse: "BUSSIGNY 68B-68I", base: "LC.75" },
  { sehl: 25, adresse: "BOVERESSES 29-75", base: "LC.65" },
  { sehl: 26, adresse: "CAPELARD 1-3", base: "RC.47" },
  { sehl: 27, adresse: "CASSINETTE 10-12", base: "LC.53" },
  { sehl: 28, adresse: "CASSINETTE 17", base: "LC.75" },
  { sehl: 29, adresse: "CHAILLY 24-24 B", base: "LC.75" },
  { sehl: 30, adresse: "CHAMPRILLY 1-7", base: "LC.75" },
  { sehl: 31, adresse: "CHAMPRILLY 16-20", base: "LC.75" },
  { sehl: 32, adresse: "CHANDIEU 28-38", base: "LC.75" },
  { sehl: 33, adresse: "CHANTEMERLE 6", base: "RC.47" },
  { sehl: 34, adresse: "CHANTEMERLE 8", base: "RC.47" },
  { sehl: 35, adresse: "CHATELAUD 30-30 B", base: "LC.75" },
  { sehl: 36, adresse: "CHAVANNES 103-149", base: "LC.65" },
  { sehl: 37, adresse: "CHAVANNES 201-213", base: "LC.75" },
  { sehl: 38, adresse: "CHENEAU-DE-BOURG 2-8", base: "RC.47" },
  { sehl: 39, adresse: "CLOCHATTE 22-34", base: "LC.75" },
  { sehl: 40, adresse: "CLOCHETONS 5-5 B", base: "LC.75" },
  { sehl: 41, adresse: "CLOCHETONS 5-7 B", base: "LC.75" },
  { sehl: 42, adresse: "CONTIGNY 2-6 + 8-12", base: "LC.75" },
  { sehl: 43, adresse: "CONTIGNY 28-30 (DESUBVENTIONNE)", base: "LC.53" },
  { sehl: 44, adresse: "BONNE ESPERANCE 30", base: "LC.2007" },
  { sehl: 45, adresse: "COUR 89", base: "LC.75" },
  { sehl: 46, adresse: "COUR 140+144-152 (DESUBVENTIONNE)", base: "LC.65" },
  { sehl: 47, adresse: "CRETES 26-28", base: "LC.75" },
  { sehl: 48, adresse: "DROUEY 16-16 B", base: "LC.75" },
  { sehl: 49, adresse: "ECHALLENS 92-96", base: "LC.75" },
  { sehl: 50, adresse: "ENTRE-BOIS 9", base: "LC.53" },
  { sehl: 51, adresse: "ENTRE-BOIS 11", base: "LC.53" },
  { sehl: 52, adresse: "ENTRE-BOIS 13", base: "LC.75" },
  { sehl: 53, adresse: "ENTRE-BOIS 12-16", base: "LC.75" },
  { sehl: 54, adresse: "ENTRE-BOIS 17", base: "LC.75" },
  { sehl: 55, adresse: "ENTRE-BOIS 18-28", base: "LC.75" },
  { sehl: 56, adresse: "ENTRE-BOIS 30-34", base: "LC.53" },
  { sehl: 57, adresse: "ENTRE-BOIS 42-50", base: "LC.2007" },
  { sehl: 58, adresse: "ETERPEYS 16-22 ET 30-32", base: "LC.75" },
  { sehl: 59, adresse: "ETERPEYS 1-7:10-14/24-28", base: "LC.75" },
  { sehl: 60, adresse: "ETERPEYS 9-19", base: "LC.75" },
  { sehl: 61, adresse: "FAUQUEZ 1-5", base: "RC.47" },
  { sehl: 62, adresse: "FAUQUEZ 6-8", base: "RC.47" },
  { sehl: 63, adresse: "FAUQUEZ 39", base: "LC.75" },
  { sehl: 64, adresse: "FAVERGES 4-10", base: "LC.75" },
  { sehl: 65, adresse: "FLORENCY 7-9", base: "RC.47" },
  { sehl: 66, adresse: "FORET 1-5", base: "LC.75" },
  { sehl: 67, adresse: "FORET 7-15", base: "LC.75" },
  { sehl: 68, adresse: "FORET 10-12", base: "LC.75" },
  { sehl: 69, adresse: "FRANCE 60", base: "LC.75" },
  { sehl: 70, adresse: "FRANCE 81-85 (DESUBVENTIONNE)", base: "LC.75" },
  { sehl: 71, adresse: "GRATTA-PAILLE 18-21", base: "LC.75" },
  { sehl: 72, adresse: "HARPE 36-50", base: "LC.75" },
  { sehl: 73, adresse: "JOMINI 22", base: "LC.53" },
  { sehl: 74, adresse: "JOMINI", base: "LC.75" },
  { sehl: 75, adresse: "LIBELLULES 2-2B-4", base: "LC.75" },
  { sehl: 76, adresse: "MAIS. FAMILIALES 1-42", base: "RC.47" },
  { sehl: 77, adresse: "MALLEY 1-13", base: "LC.2007" },
  { sehl: 78, adresse: "MALLEY 2-10", base: "LC.2007" },
  { sehl: 79, adresse: "MARTINET 5-11", base: "LC.75" },
  { sehl: 80, adresse: "MEMISE 7", base: "LC.75" },
  { sehl: 81, adresse: "MONT-D'OR 47-49", base: "LC.75" },
  { sehl: 82, adresse: "MONT D'OR 54-58", base: "LC.75" },
  { sehl: 83, adresse: "MONTELLY 9-8-C", base: "LC.75" },
  { sehl: 84, adresse: "MONTELLY 34-44 (ANCIENS DEMOLIS)", base: "LC.75" },
  { sehl: 85, adresse: "MONTELLY 41-41 A-B-C", base: "LC.75" },
  { sehl: 86, adresse: "MONTELLY 45-47", base: "LC.75" },
  { sehl: 87, adresse: "MONTELLY 55-57", base: "LC.75" },
  { sehl: 88, adresse: "MONTELLY 59-61", base: "LC.75" },
  { sehl: 89, adresse: "MONTELLY 53-61", base: "LC.75" },
  { sehl: 90, adresse: "MONTELLY 65-69", base: "LC.75" },
  { sehl: 91, adresse: "MONTELLY 67-69", base: "LC.75" },
  { sehl: 92, adresse: "MONTELLY 74-76", base: "LC.75" },
  { sehl: 93, adresse: "MONTELLY 77-79", base: "LC.75" },
  { sehl: 94, adresse: "MONTMELIAN 15-17", base: "LC.75" },
  { sehl: 95, adresse: "MONTOILLEU 83 B", base: "LC.75" },
  { sehl: 96, adresse: "BEREE 34A, 34B", base: "LC.2007" },
  { sehl: 97, adresse: "MONTELLY 36-38", base: "LC.75" },
  { sehl: 98, adresse: "MONTOUTLET 18", base: "LC.75" },
  { sehl: 99, adresse: "PALUD 7", base: "LC.75" },
  { sehl: 100, adresse: "PAVEMENT 43-59", base: "LC.75" },
  { sehl: 101, adresse: "PAVEMENT 65-67", base: "LC.75" },
  { sehl: 102, adresse: "PETIT FLONT 51-53", base: "LC.75" },
  { sehl: 103, adresse: "PIDOU 10-18 HARPE 34", base: "LC.75" },
  { sehl: 104, adresse: "MONTELLY 71", base: "LC.75" },
  { sehl: 105, adresse: "PIERREVAL 11-15", base: "LC.75" },
  { sehl: 106, adresse: "PLAINES-DU-LOUP 10-24", base: "LC.75" },
  { sehl: 107, adresse: "PONTAISE 2-4", base: "LC.75" },
  { sehl: 108, adresse: "PONTAISE 50", base: "LC.75" },
  { sehl: 109, adresse: "PIERRE 10-20", base: "LC.75" },
  { sehl: 110, adresse: "PRAIRIE 36", base: "LC.75" },
  { sehl: 111, adresse: "PRAZ-SESCHAUD 2-10", base: "LC.53" },
  { sehl: 112, adresse: "PRAZ-SESCHAUD 1-9", base: "LC.53" },
  { sehl: 113, adresse: "PRAZ-SESCHAUD 2-12", base: "LC.75" },
  { sehl: 114, adresse: "PRAZ-SESCHAUD 14-30", base: "LC.75" },
  { sehl: 115, adresse: "PRILLY 1-13", base: "LC.75" },
  { sehl: 116, adresse: "PRILLY 15-17", base: "RC.47" },
  { sehl: 117, adresse: "PRILLY 15-19", base: "LC.75" },
  { sehl: 118, adresse: "PYRAMIDES 6-8", base: "LC.75" },
  { sehl: 119, adresse: "RAVIN 8", base: "LC.75" },
  { sehl: 120, adresse: "RENENS 34-48", base: "LC.75" },
  { sehl: 121, adresse: "CESAR-ROUX 29 (désubventionné dès 2016)", base: "LC.75" },
  { sehl: 122, adresse: "SABLONS 5-7", base: "LC.75" },
  { sehl: 123, adresse: "ST-ROCH 15", base: "LC.75" },
  { sehl: 124, adresse: "SAUGES 37", base: "LC.75" },
  { sehl: 125, adresse: "TIVOLI 34-42", base: "LC.75" },
  { sehl: 126, adresse: "TOUR-GRISE 10-20", base: "LC.75" },
  { sehl: 127, adresse: "VIEUX-MOULIN 16-18", base: "LC.75" },
  { sehl: 128, adresse: "VINET 31", base: "LC.75" },
  { sehl: 129, adresse: "WARNERY 12-14", base: "LC.75" },
  { sehl: 130, adresse: "CHAMPRILLY 9-15", base: "LC.75" },
  { sehl: 131, adresse: "ANCIEN-STAND 2-10", base: "LC.75" },
  { sehl: 132, adresse: "FAUQUEZ 73", base: "LC.75" },
  { sehl: 133, adresse: "FAUQUEZ 27", base: "LC.75" },
  { sehl: 134, adresse: "FAUQUEZ 69-71", base: "LC.75" },
  { sehl: 135, adresse: "FAUQUEZ 59-61", base: "LC.75" },
  { sehl: 136, adresse: "PRAZ-SESCHAUD 21-23/32-40", base: "LC.75" },
  { sehl: 137, adresse: "FLORENCY 10", base: "LC.75" },
  { sehl: 138, adresse: "GRAVIERE 9-11-13", base: "LC.75" },
  { sehl: 139, adresse: "CLOCHATTE 14:14A:14B", base: "LC.75" },
  { sehl: 140, adresse: "BORDE 51-57 BIS", base: "LC.75" },
  { sehl: 141, adresse: "PAVEMENT 99", base: "LC.75" },
  { sehl: 142, adresse: "ST-LAURENT 6-8/ARLAUD 1", base: "LC.75" },
  { sehl: 143, adresse: "FAUQUEZ 75", base: "RC.47" },
  { sehl: 144, adresse: "VANIL 6", base: "LC.75" },
  { sehl: 145, adresse: "CITE DERRIERE 20-28", base: "LC.75" },
  { sehl: 146, adresse: "BOIS-GENOUD 34", base: "LC.75" },
  { sehl: 147, adresse: "COUR 78", base: "LC.75" },
  { sehl: 148, adresse: "ETERPEYS 2-4-6-8", base: "LC.75" },
  { sehl: 149, adresse: "ST-ROCH 11", base: "LC.75" },
  { sehl: 150, adresse: "MONTMELIAN 6", base: "LC.75" },
  { sehl: 151, adresse: "FIGUIERS-RHODANIE 39", base: "LC.75" },
  { sehl: 152, adresse: "MONTOLIEU 37-56-58", base: "LC.75" },
  { sehl: 153, adresse: "CITE DERRIERE 18", base: "LC.75" },
  { sehl: 154, adresse: "CHABLAIS 49", base: "LC.75" },
  { sehl: 155, adresse: "COUCHIRARD 18-30", base: "LC.75" },
  { sehl: 156, adresse: "PRAZ 2-4/MORGES 60A/RENENS 13-15", base: "LC.75" },
  { sehl: 157, adresse: "PRELAZ 3-5-8/ RENENS 17", base: "LC.75" },
  { sehl: 158, adresse: "PRELAZ 9-10:12-14/RENENS 19-21", base: "LC.75" },
  { sehl: 159, adresse: "OISEAUX 48", base: "LC.75" },
  { sehl: 160, adresse: "HALDIMAND 3 - ARLAUD 2", base: "LC.75" },
  { sehl: 161, adresse: "PLAINES-DU-LOUP 2C-2D", base: "LC.75" },
  { sehl: 162, adresse: "PRAIRIE 20", base: "LC.75" },
  { sehl: 163, adresse: "TEMPLE 10 A B C D", base: "LC.75" },
  { sehl: 164, adresse: "Borde 7 (désubventionné 2021)", base: "LC.75" },
  { sehl: 165, adresse: "MALLEY 22-24", base: "LC.75" },
  { sehl: 166, adresse: "ECHALLENS 3-7", base: "LC.75" },
  { sehl: 167, adresse: "CLOCHATTE 16 A-B-C", base: "LC.75" },
  { sehl: 168, adresse: "CENTRALE 26-28-30", base: "LC.75" },
  { sehl: 169, adresse: "COLLINE 14 A 56", base: "LC.75" },
  { sehl: 170, adresse: "ECHALLENS 85/RECORODN 46", base: "LC.75" },
  { sehl: 171, adresse: "MONT D'OR 42", base: "LC.75" },
  { sehl: 172, adresse: "SAUGES 35", base: "LC.2007" },
  { sehl: 173, adresse: "MORGES 37", base: "LC.2007" },
  { sehl: 174, adresse: "BEREE 22C-D, 24A-B, 26A-B", base: "LC.2007" },
  { sehl: 175, adresse: "SEVELIN 10-12", base: "LC.2007" },
  { sehl: 176, adresse: "SALLAZ 5-7-9", base: "LC.2007" },
  { sehl: 177, adresse: "SALLAZ 11-13-15", base: "LC.2007" },
  { sehl: 178, adresse: "BEREE 28-30-32", base: "LC.2007" },
  { sehl: 179, adresse: "MORGES 58", base: "LC.2007" },
  { sehl: 180, adresse: "RENENS 74", base: "LC.2007" },
  { sehl: 5042, adresse: "", base: "" },
  { sehl: 5053, adresse: "ELISABETH-JEANNE-DE-CERJAT 6-8:14-16", base: "LC.2007" },
  { sehl: 5054, adresse: "PLAINES-DU-LOUP 51A-51B-53", base: "LC.2007" },
  { sehl: 5055, adresse: "ELISABETH-JEANNE-DE-CERJAT 2-4", base: "LC.2007" },
  { sehl: 5056, adresse: "ELISA-SERMENT 7-13 BOSSONS 30", base: "LC.2007" },
  { sehl: 5057, adresse: "GERMAINE-ERNST 2-4-6", base: "LC.2007" },
  { sehl: 5058, adresse: "PLAINES-DU-LOUP 47a-47b", base: "LC.2007" },
  { sehl: 5060, adresse: "GERMAINE-ERNST 8-10", base: "LC.2007" },
];
// ---------- Helpers ----------
const stripDiacritics = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const normalize = (s: unknown): string => stripDiacritics(String(s ?? "")).toLowerCase();

// Détection "désubventionné" + "anciens démolis" (variantes, tirets, pluriels)
const DESUB_REGEX =
  /\b(d[eé]subventionn[eé]e?s?)\b|\bancien(s)?\s+d[eé]moli(s)?\b|\bex[-\s]?subventionn[eé]e?s?\b/i;
const isDesubv = (adresse?: string): boolean => DESUB_REGEX.test(adresse ?? "");

// Tri FR conscient des accents, chiffres, casse
const collator = new Intl.Collator("fr", { sensitivity: "base", numeric: true });

// Petit hook de debounce
function useDebounced<T>(value: T, delay = 200) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

// ---------- Composant principal ----------
const ImmeublesList: React.FC = () => {
  const [query, setQuery] = useState<string>("");
  const debouncedQuery = useDebounced(query, 200);

  const [baseFilter, setBaseFilter] = useState<string>("toutes");
  const [etatFilter, setEtatFilter] = useState<"tous" | "actif" | "desub">("tous");
  const [sortBy, setSortBy] = useState<{ key: SortKey; dir: SortDir }>({ key: "sehl", dir: "asc" });
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);

  // Options de base légale
  const baseOptions = useMemo(() => {
    const set = new Set(RAW_DATA.map((d) => d.base).filter(Boolean));
    return ["toutes", ...Array.from(set).sort((a, b) => collator.compare(a, b))];
  }, []);

  // Filtrage + recherche
  const filtered = useMemo(() => {
    const nq = normalize(debouncedQuery);
    return RAW_DATA.filter((row) => {
      const matchesQuery =
        !nq ||
        normalize(row.adresse).includes(nq) ||
        String(row.sehl).includes(nq) ||
        normalize(row.base).includes(nq);

      const matchesBase = baseFilter === "toutes" || row.base === baseFilter;

      const etat = isDesubv(row.adresse) ? "desub" : "actif";
      const matchesEtat = etatFilter === "tous" || etat === etatFilter;

      return matchesQuery && matchesBase && matchesEtat;
    });
  }, [debouncedQuery, baseFilter, etatFilter]);

  // Tri
  const sorted = useMemo(() => {
    const data = [...filtered];
    const dir = sortBy.dir === "asc" ? 1 : -1;
    data.sort((a, b) => {
      if (sortBy.key === "sehl") return (a.sehl - b.sehl) * dir;
      const va = a[sortBy.key] ?? "";
      const vb = b[sortBy.key] ?? "";
      return collator.compare(va, vb) * dir;
    });
    return data;
  }, [filtered, sortBy]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  useEffect(() => { setPage(1); }, [debouncedQuery, baseFilter, etatFilter, pageSize]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  // Export CSV (respecte filtres + tri)
  const exportCSV = (sep: ";" | "," = ";") => {
    const header = ["Numéro SEHL", "Adresse", "Base légale", "État"].join(sep);
    const lines = sorted.map((r) =>
      [r.sehl, r.adresse, r.base, isDesubv(r.adresse) ? "désubventionné" : "actif"]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(sep)
    );
    const csv = [header, ...lines].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `immeubles_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSort = (key: SortKey) =>
    setSortBy((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }));

  const headerCell = (label: string, key: SortKey) => {
    const active = sortBy.key === key;
    const dirSymbol = active ? (sortBy.dir === "asc" ? "↑" : "↓") : "";
    return (
      <Button
        variant="ghost"
        className="px-2"
        onClick={() => toggleSort(key)}
        aria-label={`Trier par ${label}`}
        title={`Trier par ${label}`}
      >
        <span className="mr-2">{label}</span>
        <ArrowUpDown className="h-4 w-4" />
        <span className="ml-1 text-xs text-muted-foreground">{dirSymbol}</span>
      </Button>
    );
  };

  const activeBadges = (
    <div className="flex flex-wrap gap-2">
      {baseFilter !== "toutes" && <Badge variant="secondary">Base : {baseFilter}</Badge>}
      {etatFilter !== "tous" && (
        <Badge variant={etatFilter === "desub" ? "destructive" : "default"}>
          État : {etatFilter === "desub" ? "désubventionné" : "actif"}
        </Badge>
      )}
      {query && <Badge variant="outline">Recherche : “{query}”</Badge>}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="p-0 md:p-2 lg:p-4"
    >
      <div className="mb-4 md:mb-6">
        <h2 className="text-xl md:text-2xl font-semibold">Immeubles — Office Communal du Logement</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Recherche, filtrage, tri (FR), pagination, badges actifs, export CSV.
        </p>
      </div>

      {/* Filtres */}
      <Card className="mb-3 md:mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Filtres</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="col-span-1 md:col-span-2">
            <label className="text-sm font-medium">Recherche</label>
            <Input
              placeholder="SEHL, adresse ou base légale…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Base légale</label>
            <Select value={baseFilter} onValueChange={setBaseFilter}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Toutes" />
              </SelectTrigger>
              <SelectContent>
                {baseOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt === "toutes" ? "Toutes" : opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">État</label>
            <Select value={etatFilter} onValueChange={(v: "tous" | "actif" | "desub") => setEtatFilter(v)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous</SelectItem>
                <SelectItem value="actif">Actif</SelectItem>
                <SelectItem value="desub">Désubventionné</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Lignes / page</label>
            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={String(DEFAULT_PAGE_SIZE)} />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Barre d’actions */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setQuery("");
              setBaseFilter("toutes");
              setEtatFilter("tous");
              setSortBy({ key: "sehl", dir: "asc" });
              setPage(1);
            }}
            title="Réinitialiser tous les filtres"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Réinitialiser
          </Button>
          <Badge variant="secondary">
            {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
          </Badge>
          {activeBadges}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => exportCSV(";")} title="Export CSV (séparateur ;)">
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Tableau */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]" aria-sort={sortBy.key === "sehl" ? (sortBy.dir === "asc" ? "ascending" : "descending") : "none"}>
                  {headerCell("N° SEHL", "sehl")}
                </TableHead>
                <TableHead className="min-w-[340px]" aria-sort={sortBy.key === "adresse" ? (sortBy.dir === "asc" ? "ascending" : "descending") : "none"}>
                  {headerCell("Adresse", "adresse")}
                </TableHead>
                <TableHead className="w-[180px]" aria-sort={sortBy.key === "base" ? (sortBy.dir === "asc" ? "ascending" : "descending") : "none"}>
                  {headerCell("Base légale", "base")}
                </TableHead>
                <TableHead className="w-[150px]">État</TableHead>
                <TableHead className="w-[160px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    Aucun résultat. Ajuste tes filtres ou ta recherche.
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((row) => {
                  const etat = isDesubv(row.adresse) ? "desub" : "actif";
                  return (
                    <TableRow key={`${row.sehl}-${row.adresse}`} className={etat === "desub" ? "opacity-90" : ""}>
                      <TableCell className="font-medium">{row.sehl ?? <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell className="whitespace-pre-wrap">
                        {row.adresse || <span className="text-muted-foreground italic">(Adresse manquante)</span>}
                      </TableCell>
                      <TableCell>{row.base || <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell>
                        {etat === "desub" ? (
                          <Badge variant="destructive">Désubventionné</Badge>
                        ) : (
                          <Badge>Actif</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="ghost" title="Voir le détail">
                            <Eye className="h-4 w-4 mr-1" />
                            Voir
                          </Button>
                          <Button size="sm" variant="secondary" title="Éditer l’enregistrement">
                            <Pencil className="h-4 w-4 mr-1" />
                            Éditer
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4">
          <div className="text-sm text-muted-foreground">
            Page {page} / {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Page précédente"
              title="Page précédente"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Page suivante"
              title="Page suivante"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <div className="mt-4 text-xs text-muted-foreground">
        Astuce : le badge « Désubventionné » est inféré si l’adresse contient “désubventionné”, “ex-subventionné”,
        ou “anciens démolis”. Ajuste <code>DESUB_REGEX</code> selon tes conventions.
      </div>
    </motion.div>
  );
};

export default ImmeublesList;
