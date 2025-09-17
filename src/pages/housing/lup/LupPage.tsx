// src/pages/housing/lup/LupPage.tsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import { Search, Download, Upload, Layers, ChevronDown, MapPin, AlertTriangle, X } from "lucide-react";

import { CATEGORIES, BASES } from "./constants";
import { RAW, RAW_VDL, RAW_META, RAW_VDL_TOTAL } from "./raw";
import { classNames } from "./classNames";
import { computeKPIs } from "./computeKPIs";
import { downloadCSV } from "./downloadCSV";
import { sortRows } from "./sortRows";
import { useFilters } from "./useFilters";

import { CatBadge } from "./CatBadge";
import { StatutBadge } from "./StatutBadge";
import { Chip } from "./Chip";
import { Toggle } from "./Toggle";
import { DropdownMulti } from "./DropdownMulti";
import { Panel } from "./Panel";
import { MiniMap } from "./MiniMap";
import { TableHeaderCell } from "./TableHeaderCell";

export default function LupPage() {
  // Normalize to keep the UI happy (statut/reconn may be missing on VdL items)
const ALL_ROWS = useMemo(
  () =>
    [...RAW, ...RAW_VDL].map((r: any) => ({
      statut: "Actif",
      reconn: r.reconn ?? "Commune",
      overlapLADA: false,
      cross: [],
      coords: undefined,
      ...r,
    })),
  []
);

const [rows] = useState(ALL_ROWS);

  const filters = useFilters();
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "intitule", dir: "asc" });
  const [selected, setSelected] = useState<any>(null);

  // --- Nouveau: coche “Voir carte”
  const [showMap, setShowMap] = useState(false);

  // --- Secteur dropdown state (ouverture/fermeture contrôlée)
  const [sectorOpen, setSectorOpen] = useState(false);
  const [sectorFilter, setSectorFilter] = useState("");
  const sectorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!sectorRef.current) return;
      if (!sectorRef.current.contains(e.target as Node)) setSectorOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSectorOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const secteurs = useMemo(() => {
    const set = new Map<number, string>();
    rows.forEach((r: any) => set.set(r.secteur.code, r.secteur.label));
    return [...set.entries()].map(([code, label]) => ({ value: String(code), label: `${label} (${code})` }));
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r: any) => {
      const q = filters.q.trim().toLowerCase();
      const txt = `${r.intitule} ${r.rue} ${r.entrees} ${r.adresse} ${r.proprietaire} ${r.gerance} ${r.remarques}`.toLowerCase();
      if (q && !txt.includes(q)) return false;
      if (filters.cats.length && !filters.cats.includes(r.categorie)) return false;
      if (filters.bases.length && !filters.bases.includes(r.base)) return false;
      if (filters.secteur && String(r.secteur.code) !== String(filters.secteur)) return false;
      if (!filters.showFuture && (r.statut === "A venir" || r.statut === "En projet")) return false;
      if (filters.onlyDivergences) {
        const flag = /(attention|correction|diverg|à clarifier|à confirmer)/i.test(r.remarques || "");
        if (!flag) return false;
      }
      return true;
    });
  }, [rows, filters]);

  const sorted = useMemo(() => sortRows(filtered, sort), [filtered, sort]);
  const { byCat, gross, net, overlapToRemove } = useMemo(
    () => computeKPIs(sorted, filters.dedup),
    [sorted, filters.dedup]
  );

  useEffect(() => {
    if (selected) {
      const stillThere = (sorted as any[]).find((r) => r.id === selected.id);
      if (!stillThere) setSelected(null);
    }
  }, [sorted, selected]);

  const secteursShown = useMemo(() => {
    if (!sectorFilter.trim()) return secteurs;
    const v = sectorFilter.toLowerCase();
    return secteurs.filter((s) => s.label.toLowerCase().includes(v));
  }, [secteurs, sectorFilter]);

  return (
    <div className="p-4 md:p-6 lg:p-8 font-sans">
      {/* Header */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-black text-white grid place-items-center font-bold">LUP</div>
          <div>
            <h1 className="text-2xl font-semibold">Office communal du Logement — Maquette LUP</h1>
            <p className="text-sm text-gray-500">Catalogue LLM · LLA/LLR · LADA · LS · LE (démo)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white border rounded-2xl px-3 py-2 shadow-sm">
            <Search className="h-4 w-4 text-gray-500" />
            <input
              className="outline-none text-sm w-64"
              placeholder="Rechercher une adresse, gérance, remarque…"
              value={filters.q}
              onChange={(e) => filters.setQ(e.target.value)}
            />
          </div>
          <button
            onClick={() => downloadCSV("lup_export.csv", sorted as any[])}
            className="inline-flex items-center gap-2 border rounded-2xl px-3 py-2 text-sm hover:bg-gray-50"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button
            onClick={() => alert("Import démo — à connecter au parseur Excel multi-onglets.")}
            className="inline-flex items-center gap-2 border rounded-2xl px-3 py-2 text-sm hover:bg-gray-50"
          >
            <Upload className="h-4 w-4" /> Importer
          </button>
        </div>
      </header>

      {/* Filtres (rangée 1) */}
      <section className="mb-2">
        <div className="flex flex-wrap items-center gap-3">
          <DropdownMulti
            label="Catégories"
            options={CATEGORIES.map((c) => ({ value: c.key, label: c.label }))}
            values={filters.cats}
            onChange={filters.setCats}
          />

          <DropdownMulti label="Base légale" options={BASES as any} values={filters.bases} onChange={filters.setBases} />

          {/* Secteur (dropdown contrôlé) */}
          <div className="relative" ref={sectorRef}>
            <button
              onClick={() => setSectorOpen((o) => !o)}
              className={classNames(
                "flex items-center gap-2 border rounded-xl px-3 py-2 text-sm hover:bg-gray-50",
                filters.secteur && "border-emerald-300 bg-emerald-50/50"
              )}
              aria-expanded={sectorOpen}
              aria-haspopup="listbox"
            >
              <Layers className="h-4 w-4" /> Secteur
              <ChevronDown className={classNames("h-4 w-4 transition", sectorOpen && "rotate-180")} />
              {filters.secteur && (
                <span className="ml-2 rounded-full bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5">
                  {secteurs.find((s) => s.value === String(filters.secteur))?.label || filters.secteur}
                </span>
              )}
              {filters.secteur && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    filters.setSecteur("");
                  }}
                  className="ml-1 p-1 rounded hover:bg-emerald-100"
                  title="Effacer le filtre secteur"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </button>

            {sectorOpen && (
              <div
                role="listbox"
                className="absolute z-20 mt-2 w-72 bg-white rounded-xl shadow-lg border p-2 max-h-72 overflow-auto"
              >
                <input
                  className="w-full border rounded-lg px-2 py-1 text-sm mb-2"
                  placeholder="Filtrer…"
                  value={sectorFilter}
                  onChange={(e) => setSectorFilter(e.target.value)}
                  autoFocus
                />
                <div className="flex flex-col gap-1 max-h-56 overflow-auto pr-1">
                  <button
                    className={classNames(
                      "text-left px-2 py-1 rounded hover:bg-gray-50 flex items-center justify-between",
                      !filters.secteur && "bg-emerald-50"
                    )}
                    onClick={() => {
                      filters.setSecteur("");
                      setSectorOpen(false);
                    }}
                  >
                    Tous les secteurs
                    {!filters.secteur && <span className="text-emerald-600 text-xs">sélectionné</span>}
                  </button>

                  {secteursShown.map((s) => {
                    const active = String(filters.secteur) === s.value;
                    return (
                      <button
                        key={s.value}
                        className={classNames(
                          "text-left px-2 py-1 rounded hover:bg-gray-50 flex items-center justify-between",
                          active && "bg-emerald-50"
                        )}
                        onClick={() => {
                          filters.setSecteur(s.value);
                          setSectorOpen(false);
                        }}
                      >
                        <span>{s.label}</span>
                        {active && <span className="text-emerald-600 text-xs">sélectionné</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Chips actifs */}
          <div className="flex items-center gap-2 ml-auto">
            {filters.cats.map((c) => (
              <Chip
                key={c}
                label={CATEGORIES.find((x) => x.key === c)?.label || c}
                onRemove={() => filters.setCats(filters.cats.filter((x) => x !== c))}
              />
            ))}
            {filters.bases.map((b) => (
              <Chip key={b} label={`Base ${b}`} onRemove={() => filters.setBases(filters.bases.filter((x) => x !== b))} />
            ))}
            {filters.secteur && (
              <Chip
                label={`Secteur ${
                  secteurs.find((s) => s.value === String(filters.secteur))?.label || filters.secteur
                }`}
                onRemove={() => filters.setSecteur("")}
              />
            )}
          </div>
        </div>

        {/* Filtres (rangée 2) — toggles + coche Voir carte */}
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <Toggle checked={filters.dedup} onChange={filters.setDedup} label="Dédupliquer LLM↔LADA dans les totaux" />
          <Toggle checked={filters.showFuture} onChange={filters.setShowFuture} label="Inclure ‘À venir / En projet’" />
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={filters.onlyDivergences}
              onChange={(e) => filters.setOnlyDivergences(e.target.checked)}
            />
            <span className="text-sm">Voir seulement les divergences</span>
          </label>

          {/* Coche Voir carte */}
          <label className="inline-flex items-center gap-2 cursor-pointer select-none ml-auto">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={showMap}
              onChange={(e) => setShowMap(e.target.checked)}
            />
            <span className="text-sm flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              Voir carte
            </span>
          </label>
        </div>
      </section>

      {/* KPIs */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {CATEGORIES.map((c) => (
          <div key={c.key} className="rounded-2xl border bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <CatBadge cat={c.key as any} />
              <span className="text-xs text-gray-400">brut</span>
            </div>
            <div className="text-2xl font-semibold mt-1">{(byCat as any)[c.key] || 0}</div>
          </div>
        ))}
        <div className="rounded-2xl border bg-white p-3 shadow-sm col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Total</span>
            {filters.dedup ? (
              <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">net (sans double)</span>
            ) : (
              <span className="text-xs text-gray-400">brut</span>
            )}
          </div>
          <div className="text-2xl font-semibold mt-1">{filters.dedup ? net : gross}</div>
          {filters.dedup && overlapToRemove > 0 && (
            <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-500" />
              Déduction LLM↔LADA appliquée: −{overlapToRemove}
            </div>
          )}
        </div>
      </section>

      {/* Table + (carte optionnelle) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div
          className={classNames(
            showMap ? "lg:col-span-2" : "lg:col-span-3",
            "rounded-2xl border bg-white overflow-hidden shadow-sm"
          )}
        >
          <div className="max-h-[65vh] lg:max-h-[70vh] 2xl:max-h-[75vh] overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <TableHeaderCell label="Intitulé" sortKey="intitule" sort={sort} setSort={setSort} />
                  <TableHeaderCell label="Nbre" sortKey="nb" sort={sort} setSort={setSort} width={90} />
                  <th className="sticky top-0 bg-white z-10 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-b">
                    <div className="px-3 py-2">Catégorie</div>
                  </th>
                  <TableHeaderCell label="Base" sortKey="base" sort={sort} setSort={setSort} width={90} />
                  <TableHeaderCell label="Propriétaire" sortKey="proprietaire" sort={sort} setSort={setSort} />
                  <TableHeaderCell label="Gérance" sortKey="gerance" sort={sort} setSort={setSort} />
                  <th className="sticky top-0 bg-white z-10 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-b">
                    <div className="px-3 py-2">Secteur / Quartier</div>
                  </th>
                  <th className="sticky top-0 bg-white z-10 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-b">
                    <div className="px-3 py-2">Statut</div>
                  </th>
                  <th className="sticky top-0 bg-white z-10 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-b">
                    <div className="px-3 py-2">Remarques</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {(sorted as any[]).map((r) => (
                  <tr key={r.id} className="hover:bg-emerald-50/40 cursor-pointer" onClick={() => setSelected(r)}>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{r.intitule}</div>
                      <div className="text-xs text-gray-500">{r.adresse}</div>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.nb}</td>
                    <td className="px-3 py-2">
                      <CatBadge cat={r.categorie} />
                    </td>
                    <td className="px-3 py-2">{r.base}</td>
                    <td className="px-3 py-2">{r.proprietaire}</td>
                    <td className="px-3 py-2">{r.gerance}</td>
                    <td className="px-3 py-2">
                      <div className="text-xs text-gray-700">
                        {r.secteur.label} ({r.secteur.code})
                      </div>
                      <div className="text-xs text-gray-500">
                        {r.quartier.label} ({r.quartier.code})
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <StatutBadge statut={r.statut} />
                    </td>
                    <td className="px-3 py-2 max-w-[280px]">
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        {/(attention|correction|diverg)/i.test(r.remarques || "") && (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        )}
                        <span className="line-clamp-2">{r.remarques}</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {(sorted as any[]).length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-3 py-8 text-center text-gray-500">
                      Aucun résultat. Ajuste les filtres.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Carte: seulement si showMap est coché */}
        {showMap && (
          <div className="lg:col-span-1 rounded-2xl border bg-white p-3 shadow-sm h-[65vh] lg:h-[70vh] 2xl:h-[75vh]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Carte (maquette)</span>
              </div>
              <span className="text-xs text-gray-400">{(sorted as any[]).length} items</span>
            </div>
            <div className="h-[calc(100%-2.5rem)]">
              <MiniMap rows={sorted as any[]} onSelect={(r: any) => setSelected(r)} selectedId={selected?.id} />
            </div>
          </div>
        )}
      </section>

      {/* Panneau de détails */}
      <Panel open={!!selected} onClose={() => setSelected(null)} title={selected?.intitule}>
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <div className="text-xs text-gray-500">Adresse</div>
                <div className="text-sm font-medium">{selected.adresse}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Catégorie</div>
                <CatBadge cat={selected.categorie} />
              </div>
              <div>
                <div className="text-xs text-gray-500">Nbre logements</div>
                <div className="text-lg font-semibold">{selected.nb}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Base légale</div>
                <div className="text-sm">{selected.base}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Reconnaissance</div>
                <div className="text-sm">{selected.reconn}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Propriétaire</div>
                <div className="text-sm">{selected.proprietaire}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Gérance</div>
                <div className="text-sm">{selected.gerance}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Secteur</div>
                <div className="text-sm">
                  {selected.secteur.label} ({selected.secteur.code})
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Quartier</div>
                <div className="text-sm">
                  {selected.quartier.label} ({selected.quartier.code})
                </div>
              </div>
            </div>

            {selected.cross?.length > 0 && (
              <div className="border rounded-xl p-3 bg-amber-50/60">
                <div className="flex items-center gap-2 text-amber-700 mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">Lien LLM ↔ LADA</span>
                </div>
                <ul className="text-xs text-amber-800 pl-5 list-disc">
                  {selected.cross.map((c: any, i: number) => (
                    <li key={i}>
                      Chevauchement avec <span className="font-medium">{c.type}</span> — {c.nb} logements (ID : {c.refId})
                    </li>
                  ))}
                </ul>
                <div className="text-[11px] text-amber-700 mt-2">
                  Les totaux « net » retirent ces doublons lorsque l'option est activée.
                </div>
              </div>
            )}

            <div className="border rounded-xl p-3">
              <div className="text-xs text-gray-500">Remarques</div>
              <div className="text-sm whitespace-pre-wrap">{selected.remarques || "—"}</div>
            </div>

            <div className="flex items-center justify-between border rounded-xl p-3">
              <div className="flex items-center gap-3">
                <StatutBadge statut={selected.statut} />
                <div className="text-xs text-gray-500">Source</div>
                <div className="text-xs font-medium">{selected.source.org}</div>
                <div className="text-xs text-gray-500">
                  le {new Date(selected.source.date).toLocaleDateString("fr-CH")}
                </div>
              </div>
              <button
                onClick={() => alert("Historique des modifications — maquette.")}
                className="text-xs px-3 py-1.5 rounded-lg border hover:bg-gray-50"
              >
                Voir l'historique
              </button>
            </div>
          </div>
        )}
      </Panel>

      {/* Footer */}
      <footer className="mt-6 text-xs text-gray-500 flex items-center gap-2">
        <AlertTriangle className="h-3 w-3" />
        Maquette interactive — données d'exemple. À brancher sur l'import Excel multi-onglets (DDS/SZN) et un géocodeur.
      </footer>
    </div>
  );
}
