//src/pages/housing/lup/downloadCSV.ts
export function downloadCSV(filename: string, rows: any[]) {
const headers = [
"Catégorie",
"Intitulé",
"Nbre lgts",
"Rue",
"Entrées",
"Adresse complète",
"Base légale",
"Propriétaire",
"Gérance",
"Secteur",
"Quartier",
"Statut",
"Reconnaissance",
"Source",
"Date source",
"Remarques",
];
const esc = (s: any) => '"' + String(s ?? "").replace(/"/g, '""') + '"';
const body = rows
.map((r: any) =>
[
r.categorie,
r.intitule,
r.nb,
r.rue,
r.entrees,
r.adresse,
r.base,
r.proprietaire,
r.gerance,
`${r.secteur.label} (${r.secteur.code})`,
`${r.quartier.label} (${r.quartier.code})`,
r.statut,
r.reconn,
r.source.org,
r.source.date,
r.remarques,
]
.map(esc)
.join(",")
)
.join("\n");
const csv = [headers.join(","), body].join("\n");
const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
const url = URL.createObjectURL(blob);
const link = document.createElement("a");
link.href = url;
link.setAttribute("download", filename);
link.click();
}