// File: src/pages/housing/lup/sortRows.ts
export function sortRows(rows: any[], sort?: { key: string; dir: "asc" | "desc" } | null) {
if (!sort?.key) return rows;
const dir = sort.dir === "desc" ? -1 : 1;
return [...rows].sort((a, b) => {
const va = (a as any)[sort.key] ?? "";
const vb = (b as any)[sort.key] ?? "";
if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
return String(va).localeCompare(String(vb), "fr", { sensitivity: "base", numeric: true }) * dir;
});
}