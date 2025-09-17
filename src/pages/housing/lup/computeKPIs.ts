// File: src/pages/housing/lup/computeKPIs.ts
export function computeKPIs(rows: any[], dedup: boolean) {
const byCat = rows.reduce((acc: Record<string, number>, r: any) => {
acc[r.categorie] = (acc[r.categorie] || 0) + r.nb;
return acc;
}, {} as Record<string, number>);


let gross = rows.reduce((s, r) => s + r.nb, 0);
let overlapToRemove = 0;
if (dedup) {
rows.forEach((r) => {
if (r.categorie === "LLM" && r.overlapLADA && r.cross?.length) {
const ova = r.cross.find((c: any) => c.type === "LADA");
if (ova) overlapToRemove += ova.nb;
}
});
}
const net = gross - overlapToRemove;
return { byCat, gross, net, overlapToRemove };
}