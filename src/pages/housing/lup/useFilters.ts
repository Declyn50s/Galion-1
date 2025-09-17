// src/pages/housing/lup/useFilters.ts
import { useState } from "react";

export function useFilters(initial?: any) {
const [q, setQ] = useState(initial?.q || "");
const [cats, setCats] = useState<string[]>(initial?.cats || []);
const [bases, setBases] = useState<string[]>(initial?.bases || []);
const [secteur, setSecteur] = useState<string>(initial?.secteur || "");
const [dedup, setDedup] = useState(true);
const [showFuture, setShowFuture] = useState(false);
const [onlyDivergences, setOnlyDivergences] = useState(false);
return { q, setQ, cats, setCats, bases, setBases, secteur, setSecteur, dedup, setDedup, showFuture, setShowFuture, onlyDivergences, setOnlyDivergences };
}