// src/data/immeubles.ts
// =====================
// MISE À JOUR : ajout de l’enrichissement "gérance" à partir d’un RAW texte multi-lignes.

// ----------------- Types de base -----------------
export type LawBase = "LC.53" | "LC.65" | "LC.75" | "LC.2007" | "RC.47" | "RC.53" | "RC.65";

export type ImmeubleRow = {
  sehl: number;
  adresse: string;
  base: string;
};

type Range = [number, number];

export type GeranceInfo = {
  organisme: string;           // ex. "Commune de Lausanne - Services des gérances"
  adresseLigne1: string;       // ex. "Place Chauderon 9, case postale 5032"
  npa: string;                 // ex. "1001"
  localite: string;            // ex. "Lausanne"
  telephone: string;           // ex. "+41 21 315 49 49"
};

export type EnrichedImmeubleRow = ImmeubleRow & {
  gerance?: GeranceInfo;
};

// ----------------- Dataset IMMEUBLES (tel que fourni) -----------------
export const IMMEUBLES: ImmeubleRow[] = [
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
  { sehl: 17, adresse: "BORDE 12", base: "LC.75" },
  { sehl: 17, adresse: "BORDE 14", base: "LC.75" },
  { sehl: 17, adresse: "BORDE 16", base: "LC.75" },
  { sehl: 17, adresse: "BORDE 18", base: "LC.75" },
  { sehl: 17, adresse: "BORDE 20", base: "LC.75" },
  { sehl: 17, adresse: "BORDE 22", base: "LC.75" },
  { sehl: 17, adresse: "BORDE 12:14/ 16B-22B", base: "LC.75" },
  { sehl: 18, adresse: "BORDE 26-30", base: "LC.75" },
  { sehl: 19, adresse: "BORDE 32", base: "LC.75" },
  { sehl: 20, adresse: "BONNE ESPERANCE 32", base: "LC.2007" },
  { sehl: 21, adresse: "BORDE 44", base: "LC.75" },
  { sehl: 22, adresse: "BORDE 45-49", base: "LC.75" },
  { sehl: 23, adresse: "BORDE 51", base: "LC.75" },
  { sehl: 23, adresse: "BORDE 53", base: "LC.75" },
  { sehl: 23, adresse: "BORDE 55", base: "LC.75" },
  { sehl: 23, adresse: "BORDE 57", base: "LC.75" },
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
  { sehl: 157, adresse: "PRELAZ 3", base: "LC.75" },
  { sehl: 157, adresse: "PRELAZ 5", base: "LC.75" },
  { sehl: 157, adresse: "PRELAZ 6", base: "LC.75" },
  { sehl: 157, adresse: "PRELAZ 7", base: "LC.75" },
  { sehl: 157, adresse: "PRELAZ 8", base: "LC.75" },
  { sehl: 157, adresse: "RENENS 17", base: "LC.75" },
  { sehl: 158, adresse: "PRELAZ 9", base: "LC.75" },
  { sehl: 158, adresse: "PRELAZ 10", base: "LC.75" },
  { sehl: 158, adresse: "PRELAZ 12", base: "LC.75" },
  { sehl: 158, adresse: "PRELAZ 14", base: "LC.75" },
  { sehl: 158, adresse: "RENENS 19", base: "LC.75" },
  { sehl: 158, adresse: "RENENS 21", base: "LC.75" },
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
  { sehl: 5054, adresse: "PLAINES-DU-LOUP 51A", base: "LC.2007" },
  { sehl: 5054, adresse: "PLAINES-DU-LOUP 51B", base: "LC.2007" },
  { sehl: 5054, adresse: "PLAINES-DU-LOUP 51A-51B-53", base: "LC.2007" },
  { sehl: 5055, adresse: "ELISABETH-JEANNE-DE-CERJAT 2", base: "LC.2007" },
  { sehl: 5055, adresse: "ELISABETH-JEANNE-DE-CERJAT 4", base: "LC.2007" },
  { sehl: 5056, adresse: "ELISA-SERMENT 7-13 BOSSONS 30", base: "LC.2007" },
  { sehl: 5057, adresse: "GERMAINE-ERNST 2", base: "LC.2007" },
  { sehl: 5057, adresse: "GERMAINE-ERNST 4", base: "LC.2007" },
  { sehl: 5057, adresse: "GERMAINE-ERNST 6", base: "LC.2007" },
  { sehl: 5058, adresse: "PLAINES-DU-LOUP 47a", base: "LC.2007" },
  { sehl: 5058, adresse: "PLAINES-DU-LOUP 47b", base: "LC.2007" },
  { sehl: 5060, adresse: "GERMAINE-ERNST 8", base: "LC.2007" },
  { sehl: 5060, adresse: "GERMAINE-ERNST 10", base: "LC.2007" },
];

// ----------------- Utils adresse (inchangés + robustifiés) -----------------

export const stripDiacritics = (s: string) =>
  String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const U = (s: string) =>
  stripDiacritics(String(s ?? "")).toUpperCase().replace(/\s+/g, " ").trim();

// Types de voie & articles à ignorer pour obtenir le "noyau rue"
const TYPES = new Set([
  "AVENUE","AV","AV.","RUE","R","R.","ROUTE","RTE","RT.","CHEMIN","CH","CH.",
  "BOULEVARD","BD","PLACE","PL","IMPASSE","IMP","ALLEE","ALL","ALL.","QUAI","Q",
  "PROMENADE","PROM","JARDIN","JARDIN-DE","JARDIN DE","MAIS","MAIS.","MAISON",
  "CITE","CTE"
]);
const ARTICLES = new Set(["DE","DU","DES","LA","LE","L'","D'"]);

function streetCore(input: string): string {
  let s = U(input).replace(/[,.;]/g, " ");
  const parts = s.split(/\s+/).filter(Boolean);
  const kept = parts.filter(w =>
    !TYPES.has(w) && !ARTICLES.has(w) && !/^\d+[A-Z]*$/.test(w)
  );
  return kept.join(" ").replace(/\s+/g, " ").trim();
}

function firstHouseNumber(input: string): number | null {
  const m = U(input).match(/(\d{1,5})/);
  return m ? parseInt(m[1], 10) : null;
}

function rangesFromAdresse(adr: string): Range[] {
  let s = U(adr);
  s = s.replace(/(\d+)A(\d+)/g, "$1-$2");       // "8a10" → "8-10"
  s = s.replace(/[:/+,]/g, " ");                // ":" "/" "+" "," → " "
  s = s.replace(/(\d+)[A-Z]+/g, "$1");          // "16B" → "16"
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

// --- Index rapide des rues IMMEUBLES (pour isAdresseInImmeubles etc.)
type ImIndexValue = { ranges: Range[] };

const IMMEUBLES_INDEX: Map<string, ImIndexValue> = (() => {
  const m = new Map<string, ImIndexValue>();
  for (const row of IMMEUBLES) {
    const core = streetCore(row.adresse);
    if (!core) continue;
    const ranges = rangesFromAdresse(row.adresse);
    const prev = m.get(core);
    if (prev) prev.ranges.push(...ranges);
    else m.set(core, { ranges: [...ranges] });
  }
  for (const v of m.values()) {
    const flat = v.ranges.map(([a, b]) => `${a}-${b}`).join(" ");
    v.ranges = rangesFromAdresse(flat);
  }
  return m;
})();

export function isAdresseInImmeubles(userAdresse: string): boolean {
  const core = streetCore(userAdresse);
  if (!core) return false;
  const n = firstHouseNumber(userAdresse);
  const v = IMMEUBLES_INDEX.get(core);
  if (!v) return false;
  if (n == null) return true;
  return v.ranges.some(([a, b]) => n >= a && n <= b);
}

export const ADRESSES_SET = new Set(Array.from(IMMEUBLES_INDEX.keys()));
export const canonAdresse = U;

// --- Détection base légale depuis une adresse utilisateur (inchangé) ---
export function matchImmeuble(userAdresse: string):
  | { base: LawBase; sehl: number; adresseCanonique: string }
  | null {
  const core = streetCore(userAdresse);
  if (!core) return null;
  const n = firstHouseNumber(userAdresse);

  const rows = IMMEUBLES.filter((r) => streetCore(r.adresse) === core);
  if (rows.length === 0) return null;

  if (n == null) {
    const r = rows[0];
    return { base: r.base as LawBase, sehl: r.sehl, adresseCanonique: r.adresse };
  }
  for (const r of rows) {
    const ranges: Range[] = rangesFromAdresse(r.adresse);
    if (ranges.some(([a, b]) => n >= a && n <= b)) {
      return { base: r.base as LawBase, sehl: r.sehl, adresseCanonique: r.adresse };
    }
  }
  return null;
}

export function guessBaseFromImmeubles(userAdresse: string): LawBase | null {
  const m = matchImmeuble(userAdresse);
  return m ? m.base : null;
}

export function lawGroupFromBase(base?: string | null):
  | "RC" | "LC.53" | "LC.65" | "LC.75" | "LC.2007" | "UNKNOWN" {
  const b = String(base || "").toUpperCase();
  if (!b) return "UNKNOWN";
  if (b.startsWith("RC.")) return "RC";
  if (b === "LC.53") return "LC.53";
  if (b === "LC.65") return "LC.65";
  if (b === "LC.75") return "LC.75";
  if (b === "LC.2007") return "LC.2007";
  return "UNKNOWN";
}

// ----------------- NOUVEAU : Enrichissement gérance -----------------

// 1) Colle ici le gros bloc que tu m’as donné.
const RAW_CONTACTS = String.raw`[COLLE ICI LE TEXTE BRUT EXACT DE TA LISTE GÉRANCE]`;

// 2) Aliases pour rapprocher les libellés (orthographes/variantes)
const ALIAS: Record<string, string> = {
  "ALEXANDRE-VINET": "VINET",
  "ALOYS-FAUQUEZ": "FAUQUEZ",
  "BOIS-DE-LA-FONTAINE": "BOIS FONTAINE",
  "BONNE-ESPERANCE": "BONNE ESPERANCE",
  "CITE-DERRIERE": "CITE DERRIERE",
  "ISABELLE-DE-MONTOLIEU": "MONTOLIEU",
  "MONTMEILLAN": "MONTMELIAN",
  "PETIT-FLON": "PETIT FLONT",
  "WILLIAM-HALDIMAND": "HALDIMAND",
  // Paire mixte dans le dataset : "PIDOU 10-18 HARPE 34"
  // On laisse matcher PIDOU et HARPE indépendamment via inclusion de core.
};

function applyAlias(core: string): string {
  const name = core.replace(/\s+\d.*$/, "").trim();
  if (ALIAS[name]) {
    const tail = core.slice(name.length).trim();
    return (ALIAS[name] + (tail ? " " + tail : "")).trim();
  }
  return core;
}

// 3) Parser de la ligne d’immeubles "multi-rue / multi-numéros"
function parseBuildingLine(line: string): string[] {
  const s = line.replace(/ — | – /g, " - ").replace(/ - /g, ", ");
  const parts = s.split(",").map(p => p.trim()).filter(Boolean);
  const out: string[] = [];
  let currentStreet: string | null = null;

  for (const part of parts) {
    const m = part.match(/^(.*?)(\d.*)$/); // "Rue X " + "12a-16, 18"
    if (m) {
      const left = m[1].trim();
      const nums = m[2].trim();
      if (left && /[A-Za-zÀ-ÿ]/.test(left)) currentStreet = left;
      if (currentStreet) {
        // éclate "10 12" éventuel (rare, on a surtout virgules ou tirets)
        if (/\s/.test(nums) && !/-/.test(nums) && !/,/.test(nums)) {
          nums.split(/\s+/).forEach(n => out.push(`${currentStreet} ${n}`.trim()));
        } else {
          out.push(`${currentStreet} ${nums}`.trim());
        }
      }
    } else if (currentStreet) {
      out.push(`${currentStreet} ${part}`.trim());
    }
  }
  return out;
}

// 4) Extraction structurée depuis le RAW
type RawEntry = {
  adresseUser: string; // ex. "Aloys-Fauquez 8"
  core: string;        // normalisé
  ranges: Range[];     // plages dérivées (ex. "8, 10, 12" → [8-8],[10-10],[12-12])
  gerance: GeranceInfo;
};

function parseRawContacts(raw: string): RawEntry[] {
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const entries: RawEntry[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toUpperCase() !== "LAUSANNE") continue;
    const buildingLine = lines[i + 1];                 // ex. "Aloys-Fauquez 8, 10, 12"
    const organisme = lines[i + 2];
    const adresseLigne1 = lines[i + 3];
    const npaMaybe = lines[i + 4];
    const localiteMaybe = lines[i + 5];
    const telephoneMaybe = lines[i + 6];

    if (!buildingLine || !organisme) continue;

    // Déduire NPA/ville/tel. (tolérant : parfois des "Lausanne" parasites)
    let npa = "", localite = "", telephone = "";
    // heuristique NPA = 4 chiffres
    if (/^\d{4}$/.test(npaMaybe || "")) {
      npa = npaMaybe!;
      localite = (localiteMaybe || "").replace(/\s+/g, " ").trim();
      telephone = telephoneMaybe || "";
    } else {
      // fallback : on essaie de repérer le tél sur les 3 lignes suivantes
      const window = [npaMaybe, localiteMaybe, telephoneMaybe].filter(Boolean) as string[];
      const telIdx = window.findIndex(w => /^\+?\d/.test(w));
      if (telIdx >= 0) telephone = window[telIdx]!;
      const npaIdx = window.findIndex(w => /^\d{4}$/.test(w));
      if (npaIdx >= 0) npa = window[npaIdx]!;
      const locIdx = window.findIndex((w, j) => j !== npaIdx && w?.toUpperCase() === "LAUSANNE");
      if (locIdx >= 0) localite = window[locIdx]!;
      if (!localite) localite = "Lausanne";
    }

    const gerance: GeranceInfo = {
      organisme,
      adresseLigne1,
      npa,
      localite,
      telephone,
    };

    // éclater la/les adresses de la ligne
    const exploded = parseBuildingLine(buildingLine);
    for (const adr of exploded) {
      const coreRaw = streetCore(adr);
      const core = applyAlias(coreRaw);
      const ranges = rangesFromAdresse(adr);
      // si pas de n°, on met une plage [0, 99999] (rare)
      const r = ranges.length ? ranges : ([ [0, 99999] ] as Range[]);
      entries.push({ adresseUser: adr, core, ranges: r, gerance });
    }
  }
  return entries;
}

// 5) Construction de l’index d’enrichissement : { core → [{ranges, gerance}...] }
type EnrichSlot = { ranges: Range[]; gerance: GeranceInfo };
const ENRICH_INDEX: Map<string, EnrichSlot[]> = (() => {
  const m = new Map<string, EnrichSlot[]>();
  if (!RAW_CONTACTS || RAW_CONTACTS.includes("[COLLE ICI")) return m; // rien collé
  const rows = parseRawContacts(RAW_CONTACTS);
  for (const r of rows) {
    const arr = m.get(r.core) || [];
    arr.push({ ranges: r.ranges, gerance: r.gerance });
    m.set(r.core, arr);
  }
  return m;
})();

// 6) Match gérance pour une adresse utilisateur
export function getGeranceFor(userAdresse: string): GeranceInfo | undefined {
  const core = applyAlias(streetCore(userAdresse));
  if (!core) return;
  const n = firstHouseNumber(userAdresse) ?? -1;
  const slots = ENRICH_INDEX.get(core);
  if (!slots) return;
  // on teste les plages ; si pas de n°, on prend la première
  if (n < 0) return slots[0]?.gerance;
  for (const slot of slots) {
    if (slot.ranges.some(([a, b]) => n >= a && n <= b)) return slot.gerance;
  }
  return;
}

// 7) ENRICHED_IMMEUBLES : on projette la gérance sur chaque ligne du dataset
export const ENRICHED_IMMEUBLES: EnrichedImmeubleRow[] = IMMEUBLES.map((row) => {
  const core = applyAlias(streetCore(row.adresse));
  const ranges = rangesFromAdresse(row.adresse);
  const slots = ENRICH_INDEX.get(core);
  if (!slots) return { ...row };
  // essaie d’intersection de plages
  for (const slot of slots) {
    for (const [a, b] of ranges) {
      if (slot.ranges.some(([x, y]) => !(y < a || x > b))) {
        return { ...row, gerance: slot.gerance };
      }
    }
  }
  return { ...row };
});

// 8) Helper : retourne la même chose que matchImmeuble, avec gérance en plus
export function matchImmeubleWithGerance(userAdresse: string):
  | ({ base: LawBase; sehl: number; adresseCanonique: string } & { gerance?: GeranceInfo })
  | null {
  const baseMatch = matchImmeuble(userAdresse);
  if (!baseMatch) return null;
  const gerance = getGeranceFor(userAdresse);
  return { ...baseMatch, gerance };
}
