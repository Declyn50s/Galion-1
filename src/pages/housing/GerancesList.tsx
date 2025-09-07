// app/(ton-chemin)/GerancesList.tsx
"use client";

import React, { useMemo, useState } from "react";
import {
  Phone, Mail, Globe, Star, StarOff, Copy, Download, Filter,
  Search, Plus, ChevronUp, ExternalLink, MapPin
} from "lucide-react";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// -----------------------------
// Types
// -----------------------------

interface Contact {
  name: string;
  email?: string;
  phone?: string;
}

interface Gerance {
  id: string;
  nom: string;
  adresse1: string;
  adresse2?: string;
  cp?: string;
  telephone?: string;
  emails?: string[];
  site?: string;
  contacts?: Contact[];
  type?: "privée" | "coopérative" | "publique" | "autre";
  fav?: boolean;
}

// -----------------------------
// Données (mise à jour à partir de ta capture)
// -----------------------------

const DATA: Gerance[] = [
  {
    id: "alterimo",
    nom: "ALTERIMO",
    adresse1: "Route de Prilly 25",
    adresse2: "1023 Crissier",
    cp: "1023",
    telephone: "021 694 30 20",
    emails: ["info@alterimo.ch"],
    site: "https://www.alterimo.ch",
    contacts: [{ name: "Meghan Brunner" }],
    type: "privée",
  },
  {
    id: "bernardnicod",
    nom: "BERNARD NICOD SA",
    adresse1: "Gal. Benjamin-Constant 1, Avenue de la Gare 26",
    adresse2: "CP 5335 - 1002 Lausanne",
    cp: "1002",
    telephone: "021 331 55 55",
    emails: ["info.bnbc@bernard-nicod.ch"],
    site: "https://www.bernard-nicod.ch",
    contacts: [{ name: "Lena Baumann" }, { name: "Morgane Dubey" }],
    type: "privée",
  },
  {
    id: "borgeaud",
    nom: "BORGEAUD Gérance A. Borgeaud SA",
    adresse1: "Rue de Langallerie 1",
    adresse2: "1003 Lausanne",
    cp: "1003",
    telephone: "021 313 43 00",
    emails: [],
    site: "https://www.gerance-borgeaud.ch",
    contacts: [{ name: "Virginia Capraro" }, { name: "Nathalie Von Bueren" }],
    type: "privée",
  },
  {
    id: "braun",
    nom: "BRAUN SA Régie",
    adresse1: "Rue Centrale 5",
    adresse2: "CP 135 - 1001 Lausanne",
    cp: "1001",
    telephone: "021 342 52 52",
    site: "https://www.regiebraun.ch",
    contacts: [
      { name: "Cidalia Barbosa" },
      { name: "Aude Echenard" },
    ],
    type: "privée",
  },
  {
    id: "citejoie",
    nom: "CITE-JOIE Sté coop. Immobilière",
    adresse1: "Ch. de Villardin 14",
    adresse2: "1000 Lausanne 22",
    cp: "1000",
    telephone: "021 641 60 76",
    site: "https://www.cite-joie.ch",
    contacts: [{ name: "Valérie Ferreira" }],
    type: "coopérative",
  },
  {
    id: "cogestim",
    nom: "COGESTIM SA",
    adresse1: "Rue Etraz 5",
    adresse2: "CP 5719 - 1002 Lausanne",
    cp: "1002",
    telephone: "021 321 77 81",
    site: "https://www.cogestim.ch",
    contacts: [{ name: "Arnaud Boegli" }],
    type: "privée",
  },
  {
    id: "cpcl",
    nom: "CPCL",
    adresse1: "Rue du Petit Saint-Jean 4",
    adresse2: "CP 6904 - 1001 Lausanne",
    cp: "1001",
    telephone: "021 315 24 70",
    site: "https://www.cpcl.ch",
    contacts: [{ name: "Anne-Florence Wymann" }],
    type: "publique",
  },
  {
    id: "derham",
    nom: "DE RHAM & Cie SA",
    adresse1: "Av. Mon-Repos 14",
    adresse2: "1005 Lausanne",
    cp: "1005",
    telephone: "058 211 73 10",
    site: "https://www.derham.ch",
    contacts: [{ name: "Neuza Rocha Reis" }],
    type: "privée",
  },
  {
    id: "evam",
    nom: "EVAM, Entité Immobilier",
    adresse1: "Rue de Chavannes 33",
    adresse2: "1007 Lausanne",
    cp: "1007",
    telephone: "021 557 06 22",
    site: "https://www.evam.ch",
    contacts: [{ name: "Sandra Alfonso" }],
    type: "publique",
  },
  {
    id: "flcl",
    nom: "F.L.C.L.",
    adresse1: "Route de Chavannes 105",
    adresse2: "1004 Lausanne",
    cp: "1004",
    telephone: "021 624 96 64",
    site: "https://www.flcl.ch",
    contacts: [{ name: "Marie-Claude Vial" }, { name: "M. Meyer" }, { name: "Lyna Rouibi" }],
    type: "coopérative",
  },
  {
    id: "geranceville",
    nom: "GÉRANCE VILLE",
    adresse1: "Pl. Chauderon 9",
    adresse2: "CP 5032 - 1002 Lausanne",
    cp: "1002",
    telephone: "021 315 49 43",
    site: "https://www.lausanne.ch/slg",
    contacts: [{ name: "Roberta Dias" }, { name: "Michelle Rouge" }],
    type: "publique",
  },
  {
    id: "gerim",
    nom: "GERIM gérance immobilière SA",
    adresse1: "Av. de la Confrérie 38",
    adresse2: "CP 156 - 1008 Prilly",
    cp: "1008",
    telephone: "021 624 03 51",
    site: "https://www.gerim.ch",
    contacts: [{ name: "Natacha Haehlen" }, { name: "Maria Morales" }],
    type: "privée",
  },
  {
    id: "retraitespop",
    nom: "LES RETRAITES POPULAIRES",
    adresse1: "Rue Caroline 9",
    adresse2: "CP 288 - 1001 Lausanne",
    cp: "1001",
    telephone: "021 348 22 22",
    site: "https://www.retraitespopulaires.ch",
    contacts: [{ name: "Fanny Rothlisberger" }],
    type: "publique",
  },
  {
    id: "logacop",
    nom: "LOGACOP Sté Coop. Immobilière",
    adresse1: "Route du Châtelard 30B",
    adresse2: "CP 171 - 1018 Lausanne",
    cp: "1018",
    telephone: "021 643 10 43",
    site: "",
    contacts: [{ name: "Catherine Ajac" }], // Note: mention "Pas de chien" supprimée (remarque interne)
    type: "coopérative",
  },
  {
    id: "mbsa",
    nom: "M&B Gérance immobilière SA",
    adresse1: "Rue du Grand-St-Jean 16",
    adresse2: "CP 6819 - 1002 Lausanne",
    cp: "1002",
    telephone: "021 320 34 73",
    site: "https://www.mbsa.ch",
    contacts: [{ name: "Mireille Jaton" }, { name: "Giulia Beart" }],
    type: "privée",
  },
  {
    id: "naef",
    nom: "NAEF Immobilier Lausanne SA",
    adresse1: "Chemin du Viaduc 1",
    adresse2: "CP 155 - 1000 Lausanne 16 Malley",
    cp: "1000",
    telephone: "021 318 77 77",
    site: "https://www.naef.ch",
    contacts: [{ name: "Vanessa Blunda" }],
    type: "privée",
  },
  {
    id: "pbbg",
    nom: "P.B.B.G SA",
    adresse1: "Rue Beau-Séjour 15",
    adresse2: "CP 7095 - 1002 Lausanne",
    cp: "1002",
    telephone: "021 345 36 36",
    site: "https://www.pbbg.ch",
    contacts: [{ name: "Alexandra Suarez" }, { name: "Laura Ackermann" }],
    type: "privée",
  },
  {
    id: "publiaz",
    nom: "PUBLIAZ SA Gérance",
    adresse1: "Rue de Lausanne 51",
    adresse2: "CP 142 - 1020 Renens",
    cp: "1020",
    telephone: "021 633 51 51",
    site: "https://www.publiaz.ch",
    contacts: [{ name: "Monique Bovy" }],
    type: "privée",
  },
  {
    id: "realta",
    nom: "REALTA SA",
    adresse1: "Route de Prilly 25",
    adresse2: "1023 Crissier",
    cp: "1023",
    telephone: "021 694 30 40",
    site: "https://www.realtaimmo.ch",
    contacts: [{ name: "Sonia Garcia" }],
    type: "privée",
  },
  {
    id: "marmillod",
    nom: "REGIE MARMILLOD SA",
    adresse1: "Route d’Oro 2",
    adresse2: "CP 299 - 1000 Lausanne 10",
    cp: "1000",
    telephone: "021 321 32 00",
    site: "https://www.regiemarmillod.ch",
    contacts: [{ name: "Monica Santos" }],
    type: "privée",
  },
  {
    id: "rsservim",
    nom: "RS Servim",
    adresse1: "Av. de la Gare 29",
    adresse2: "CP 130 - 1001 Lausanne",
    cp: "1001",
    telephone: "021 312 43 74",
    site: "https://www.servim.ch",
    contacts: [{ name: "Sara Chaves" }, { name: "Ilenia Cimino" }],
    type: "privée",
  },
  {
    id: "schl",
    nom: "S.C.H.L. (Sté Coop. d’Habitation Lausanne)",
    adresse1: "Route des Plaines-du-Loup 32",
    adresse2: "CP 4232 - 1002 Lausanne 18",
    cp: "1002",
    telephone: "021 647 20 12",
    site: "https://www.schl.ch",
    contacts: [{ name: "Laetitia Knopf" }],
    type: "coopérative",
  },
  {
    id: "wincasa",
    nom: "WINCASA SA Services Immobiliers",
    adresse1: "Av. de Rumine 33",
    adresse2: "CP 7770 - 1002 Lausanne",
    cp: "1002",
    telephone: "058 455 77 77",
    site: "https://www.wincasa.ch",
    contacts: [{ name: "Berna Sinani" }],
    type: "privée",
  },
  {
    id: "zivag",
    nom: "ZIVAG Gérances SA",
    adresse1: "Pl. de la Riponne 10",
    adresse2: "CP - 1001 Lausanne",
    cp: "1001",
    telephone: "021 310 77 11",
    site: "https://www.zivag.ch",
    contacts: [{ name: "Lilian Barros" }, { name: "Michael Grasso" }],
    type: "privée",
  },
  {
    id: "etatvd",
    nom: "SERVICE IMMEUBLES, PATRIMOINE ET LOGISTIQUE (ETAT DE VAUD)",
    adresse1: "Place de la Riponne 10",
    adresse2: "Lausanne",
    cp: "1005",
    telephone: "021 316 74 74",
    site: "https://www.vd.ch",
    contacts: [{ name: "Mme Bovey" }],
    type: "publique",
  },
];

// -----------------------------
// Utils
// -----------------------------

function normalizePhone(s?: string) {
  return (s || "").replace(/\s+/g, " ").trim();
}

function toCSV(rows: Gerance[]): string {
  const headers = [
    "Nom","Adresse 1","Adresse 2","CP","Téléphone","Email(s)","Site",
    "Contact(s)","Type",
  ];
  const escape = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = rows.map((r) =>
    [
      r.nom,
      r.adresse1,
      r.adresse2 ?? "",
      r.cp ?? "",
      normalizePhone(r.telephone),
      (r.emails || []).join("; "),
      r.site || "",
      (r.contacts || []).map((c) => `${c.name}`).join("; "),
      r.type || "",
    ].map(escape).join(",")
  );
  return [headers.join(","), ...lines].join("\n");
}

function download(filename: string, text: string) {
  const element = document.createElement("a");
  element.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(text));
  element.setAttribute("download", filename);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

// -----------------------------
// Composant
// -----------------------------

export default function GerancesList() {
  const [query, setQuery] = useState("");
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Gerance | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const types = ["privée", "coopérative", "publique", "autre"];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matchesQuery = (d: Gerance) => {
      if (!q) return true;
      const hay = [
        d.nom, d.adresse1, d.adresse2, d.cp, d.telephone, d.site,
        ...(d.emails || []), ...(d.contacts || []).map((c) => c.name),
      ].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    };
    const matchesType = (d: Gerance) => typeFilters.length === 0 || (d.type ? typeFilters.includes(d.type) : false);

    return DATA.filter((d) => matchesQuery(d) && matchesType(d));
  }, [query, typeFilters]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const av = a.nom.toLowerCase();
      const bv = b.nom.toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page]);

  function toggleSortNom() {
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
  }

  function openDetails(row: Gerance) {
    setSelected(row);
    setOpen(true);
  }

  function toggleFav(id: string) {
    const idx = DATA.findIndex((d) => d.id === id);
    if (idx >= 0) DATA[idx].fav = !DATA[idx].fav;
    setQuery((q) => q + ""); // force refresh
  }

  function clearFilters() {
    setTypeFilters([]);
  }

  function copy(text?: string) {
    if (!text) return;
    navigator.clipboard?.writeText(text);
  }

  function exportCSV() {
    const csv = toCSV(sorted);
    const stamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 16);
    download(`annuaire-gerances-${stamp}.csv`, csv);
  }

  return (
    <TooltipProvider>
      <div className="w-full min-h-screen bg-neutral-50 p-6">
        {/* Header */}
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Annuaire des gérances</h1>
              <p className="text-sm text-muted-foreground">Recherche, filtres, export, fiche détaillée.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="gap-2" onClick={exportCSV}>
                <Download className="h-4 w-4" /> Exporter
              </Button>
              <Button className="gap-2" variant="default">
                <Plus className="h-4 w-4" /> Ajouter
              </Button>
            </div>
          </div>

          {/* Controls */}
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2">
                <div className="relative w-full">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Rechercher par nom, contact…"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                  />
                </div>
                {query && (
                  <Button variant="ghost" className="text-muted-foreground" onClick={() => setQuery("")}>
                    Effacer
                  </Button>
                )}
              </div>
            </div>

            <div className="col-span-1 flex items-center gap-2 md:col-span-2">
              {/* Type filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" /> Types ({typeFilters.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-60">
                  <DropdownMenuLabel>Filtrer par type</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {(["privée", "coopérative", "publique", "autre"]).map((t) => (
                    <DropdownMenuCheckboxItem
                      key={t}
                      checked={typeFilters.includes(t)}
                      onCheckedChange={(val) =>
                        setTypeFilters((prev) => (val ? [...prev, t] : prev.filter((x) => x !== t)))
                      }
                    >
                      {t}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {typeFilters.length > 0 && (
                <Button variant="ghost" onClick={clearFilters}>Réinitialiser</Button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-50/50">
                  <TableHead className="w-10"></TableHead>
                  <TableHead className="cursor-pointer" onClick={toggleSortNom}>
                    <div className="flex items-center gap-1">
                      Nom {sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <span className="rotate-180 inline-block"><ChevronUp className="h-3 w-3" /></span>}
                    </div>
                  </TableHead>
                  <TableHead>Adresse</TableHead>
                  <TableHead>Contact(s)</TableHead>
                  <TableHead>Tél.</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Site</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageData.map((row) => (
                  <TableRow key={row.id} className="hover:bg-neutral-50">
                    <TableCell className="align-top">
                      <button
                        className="rounded-full p-1 text-amber-500 hover:bg-amber-50"
                        onClick={() => toggleFav(row.id)}
                        aria-label={row.fav ? "Retirer des favoris" : "Ajouter aux favoris"}
                      >
                        {row.fav ? <Star className="h-4 w-4 fill-amber-500" /> : <StarOff className="h-4 w-4" />}
                      </button>
                    </TableCell>
                    <TableCell className="font-medium">
                      <button onClick={() => openDetails(row)} className="text-left hover:underline">
                        {row.nom}
                      </button>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div>{row.adresse1}</div>
                      {row.adresse2 && <div>{row.adresse2}</div>}
                    </TableCell>
                    <TableCell>
                      {row.contacts && row.contacts.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          <div>{row.contacts[0].name}</div>
                          {row.contacts.length > 1 && (
                            <div className="text-xs text-muted-foreground">+{row.contacts.length - 1} autre(s)</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.telephone ? (
                        <div className="flex items-center gap-2">
                          <a href={`tel:${row.telephone.replace(/\s+/g, "")}`} className="hover:underline">{row.telephone}</a>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button className="rounded p-1 hover:bg-neutral-100" onClick={() => copy(row.telephone)}>
                                <Copy className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Copier</TooltipContent>
                          </Tooltip>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.emails && row.emails.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <a href={`mailto:${row.emails[0]}`} className="truncate hover:underline max-w-[180px] inline-block">
                            {row.emails[0]}
                          </a>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button className="rounded p-1 hover:bg-neutral-100" onClick={() => copy(row.emails![0])}>
                                <Copy className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Copier</TooltipContent>
                          </Tooltip>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.site ? (
                        <a href={row.site} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">
                          <Globe className="h-4 w-4" />
                          <span className="hidden md:inline">Site</span>
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}

                {pageData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                      Aucun résultat. Ajuste la recherche ou les filtres.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">{sorted.length} résultat(s) • Page {page} / {totalPages}</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" disabled={page === 1} onClick={() => setPage(1)}>Début</Button>
              <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Préc.</Button>
              <Button variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Suiv.</Button>
              <Button variant="outline" disabled={page === totalPages} onClick={() => setPage(totalPages)}>Fin</Button>
            </div>
          </div>
        </div>

        {/* Drawer détail */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="right" className="w-[520px] sm:w-[620px]">
            {selected && (
              <div className="flex h-full flex-col">
                <SheetHeader>
                  <SheetTitle>{selected.nom}</SheetTitle>
                  <SheetDescription>Fiche de contact et actions rapides</SheetDescription>
                </SheetHeader>

                <ScrollArea className="mt-4 h-full pr-4">
                  <div className="space-y-6">
                    {/* Coordonnées */}
                    <section className="rounded-2xl border p-4">
                      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Coordonnées</h3>
                      <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                        <div>
                          <div className="flex items-start gap-2">
                            <MapPin className="mt-0.5 h-4 w-4" />
                            <div>
                              <div>{selected.adresse1}</div>
                              {selected.adresse2 && <div>{selected.adresse2}</div>}
                              <a
                                className="mt-1 inline-flex items-center gap-1 text-blue-600 hover:underline"
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selected.adresse1}, ${selected.adresse2 || ""}`)}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Ouvrir dans Maps <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {selected.telephone && (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                <a href={`tel:${selected.telephone.replace(/\s+/g, "")}`} className="hover:underline">
                                  {selected.telephone}
                                </a>
                              </div>
                              <Button variant="outline" size="sm" className="gap-2" onClick={() => copy(selected.telephone)}>
                                <Copy className="h-3 w-3" /> Copier
                              </Button>
                            </div>
                          )}
                          {selected.emails && selected.emails.length > 0 && (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                <a href={`mailto:${selected.emails[0]}`} className="hover:underline">{selected.emails[0]}</a>
                              </div>
                              <Button variant="outline" size="sm" className="gap-2" onClick={() => copy(selected.emails![0])}>
                                <Copy className="h-3 w-3" /> Copier
                              </Button>
                            </div>
                          )}
                          {selected.site && (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                <a href={selected.site} target="_blank" rel="noreferrer" className="hover:underline">
                                  {selected.site}
                                </a>
                              </div>
                              <Button asChild size="sm" variant="outline">
                                <a href={selected.site} target="_blank" rel="noreferrer" className="gap-2 inline-flex items-center">
                                  Ouvrir <ExternalLink className="h-3 w-3" />
                                </a>
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </section>

                    {/* Contacts */}
                    <section className="rounded-2xl border p-4">
                      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Contacts</h3>
                      {selected.contacts && selected.contacts.length > 0 ? (
                        <ul className="space-y-2 text-sm">
                          {selected.contacts.map((c, idx) => (
                            <li key={idx} className="flex items-center justify-between">
                              <div className="font-medium">{c.name}</div>
                              <div className="flex items-center gap-2">
                                {c.phone && (
                                  <a className="rounded-md border px-2 py-1 text-xs hover:bg-neutral-50" href={`tel:${c.phone}`}>Appeler</a>
                                )}
                                {c.email && (
                                  <a className="rounded-md border px-2 py-1 text-xs hover:bg-neutral-50" href={`mailto:${c.email}`}>Écrire</a>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-sm text-muted-foreground">Aucun contact nominatif</div>
                      )}
                    </section>
                  </div>
                </ScrollArea>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>Fermer</Button>
                    <Button className="gap-2">
                      <Mail className="h-4 w-4" /> Écrire un e-mail
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </TooltipProvider>
  );
}
