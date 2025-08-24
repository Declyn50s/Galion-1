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
import { IMMEUBLES } from "@/data/immeubles";

type Row = { sehl: number; adresse: string; base: string };
type SortKey = "sehl" | "adresse" | "base";
type SortDir = "asc" | "desc";

const DEFAULT_PAGE_SIZE = 25;

const RAW_DATA = IMMEUBLES;

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
