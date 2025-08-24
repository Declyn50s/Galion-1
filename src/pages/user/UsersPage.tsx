// src/pages/UsersPage.tsx
import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

// ⬇️ importe la liste canonique
import { isAdresseInImmeubles } from "@/data/immeubles";

type PersonJSON = {
  genre: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  adresse: string;
  complement?: string;
  npa: string;
  ville: string;
  statut: "Actif" | "Inactif" | "À vérifier" | "Refusé" | (string & {});
};

type Person = PersonJSON & { llm: boolean };

const statutColors: Record<string, string> = {
  Actif: "bg-green-500",
  Inactif: "bg-gray-400",
  "À vérifier": "bg-orange-400",
  Bloqué: "bg-red-500",
};

/* ⬇️⬇️ AJOUTS: utilitaires pour gérer la date de naissance dans plusieurs formats */

const pad2 = (n: number) => n.toString().padStart(2, "0");

type NormalizedDOB = { full?: string; short?: string };

/** Normalise une date quelconque vers:
 *  - full:  DD.MM.YYYY (si l'année à 4 chiffres est disponible)
 *  - short: DD.MM.YY
 *  Accepte input du type YYYY-MM-DD, DD.MM.YYYY, DD/MM/YY, etc.
 */
const normalizeDOB = (raw?: string): NormalizedDOB | null => {
  if (!raw) return null;
  const s = String(raw).trim();

  let d: number | undefined;
  let m: number | undefined;
  let y4: number | undefined;
  let shortFromRaw: string | undefined;

  // Cas: YYYY-MM-DD ou YYYY/MM/DD ou YYYY.MM.DD
  let m1 = s.match(/^(\d{4})[\/.\-](\d{1,2})[\/.\-](\d{1,2})$/);
  if (m1) {
    y4 = Number(m1[1]);
    m = Number(m1[2]);
    d = Number(m1[3]);
  } else {
    // Cas: DD.MM.YYYY ou DD.MM.YY (ou avec / ou -)
    const m2 = s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2}|\d{4})$/);
    if (m2) {
      d = Number(m2[1]);
      m = Number(m2[2]);
      const y = m2[3];
      if (y.length === 4) {
        y4 = Number(y);
      } else {
        // 2 chiffres: on ne devine pas le siècle ici, on ne produit que le "short"
        shortFromRaw = `${pad2(Number(m2[1]))}.${pad2(Number(m2[2]))}.${y}`;
      }
    } else {
      return null; // format non reconnu
    }
  }

  if (!d || !m) return null;
  const dd = pad2(d);
  const mm = pad2(m);

  const out: NormalizedDOB = {};
  if (typeof y4 === "number" && !Number.isNaN(y4)) {
    const yyyy = y4.toString().padStart(4, "0");
    out.full = `${dd}.${mm}.${yyyy}`;
    out.short = `${dd}.${mm}.${yyyy.slice(-2)}`;
  } else if (shortFromRaw) {
    out.short = shortFromRaw;
  }
  return out;
};

/** Vrai si la requête ressemble à une date utilisateur (DD.MM.YY ou DD.MM.YYYY) */
const isDOBQuery = (q: string) =>
  /^\d{1,2}\.\d{1,2}\.(\d{2}|\d{4})$/.test(q.trim());

/** Compare la date d'une personne avec la requête utilisateur. */
const matchDOB = (personDOB: string, query: string) => {
  const normPerson = normalizeDOB(personDOB);
  if (!normPerson) return false;

  const q = query.trim();
  if (q === "") return true; // même comportement que les includes("") existants

  if (isDOBQuery(q)) {
    const normQuery = normalizeDOB(q);
    if (!normQuery) return false;
    return (
      (normQuery.full && normQuery.full === normPerson.full) ||
      (normQuery.short && normQuery.short === normPerson.short)
    );
  }

  // Si l'utilisateur ne tape pas un pattern date strict, on tolère un simple "includes"
  return (
    (normPerson.full && normPerson.full.includes(q)) ||
    (normPerson.short && normPerson.short.includes(q)) ||
    personDOB.includes(q)
  );
};
/* ⬆️⬆️ FIN AJOUTS */

export const UsersPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/people.json", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: PersonJSON[] = await res.json();

        // ⬇️ ICI: llm = true si l'adresse est dans la liste des immeubles
        const computed: Person[] = data.map((p) => ({
          ...p,
          llm: isAdresseInImmeubles(p.adresse),
        }));

        if (mounted) setPeople(computed);
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "Erreur de chargement");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredPeople = people.filter((p) => {
    const s = search.toLowerCase();
    return (
      p.nom.toLowerCase().includes(s) ||
      p.prenom.toLowerCase().includes(s) ||
      p.ville.toLowerCase().includes(s) ||
      p.statut.toLowerCase().includes(s) ||
      /* ⬇️ Ajout: filtre sur date de naissance (DD.MM.YYYY / DD.MM.YY) */
      matchDOB(p.dateNaissance, search)
    );
  });

  if (loading) return <div className="p-6">Chargement…</div>;
  if (error) return <div className="p-6 text-red-600">Erreur : {error}</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="relative w-full max-w-md">
        <Search className="absolute left-2.5 top-2.5 h-5 w-5 text-gray-400" />
        <Input
          type="text"
          // ⬇️ Petite précision utile pour l'utilisateur
          placeholder="Rechercher (nom, ville, statut, ou DOB 31.12.1990 / 31.12.90)…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-4">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 uppercase text-xs text-gray-600">
              <tr>
                <th className="p-2">LLM</th>
                <th className="p-2">Genre</th>
                <th className="p-2">Nom</th>
                <th className="p-2">Prénom</th>
                <th className="p-2">Date de naissance</th>
                <th className="p-2">Adresse</th>
                <th className="p-2">NPA</th>
                <th className="p-2">Ville</th>
                <th className="p-2">Statut</th>
              </tr>
            </thead>
            <tbody>
              {filteredPeople.map((person, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="p-2">
                    <span
                      className={`inline-block w-3 h-3 rounded-full ${
                        person.llm ? "bg-green-500" : "bg-gray-300"
                      }`}
                      title={person.llm ? "LLM activé" : "LLM désactivé"}
                    />
                  </td>
                  <td className="p-2">{person.genre}</td>
                  <td className="p-2 uppercase">{person.nom}</td>
                  <td className="p-2">{person.prenom}</td>
                  <td className="p-2">{person.dateNaissance}</td>
                  <td className="p-2">
                    {person.adresse}
                    {person.complement && (
                      <div className="text-xs text-gray-500">
                        {person.complement}
                      </div>
                    )}
                  </td>
                  <td className="p-2">{person.npa}</td>
                  <td className="p-2">{person.ville}</td>
                  <td className="p-2">
                    <Badge
                      className={`${
                        statutColors[person.statut] ?? "bg-gray-400"
                      } text-white`}
                    >
                      {person.statut}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersPage;
