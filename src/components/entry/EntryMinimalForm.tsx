//src/components/entry/EntryMinimalForm.tsx
import React, { useRef } from "react";
import { ShieldCheck } from "lucide-react";
import { normalizeIsoDate } from "./utils";

type Props = {
  defaultNom?: string;
  defaultPrenom?: string;
  defaultDob?: string; // ISO
  onAdd: (u: {
    titre: "M." | "Mme";
    nom: string;
    prenom: string;
    dateNaissance: string;
    email?: string;
    curateur?: boolean;
  }) => void;
};

const EntryMinimalForm: React.FC<Props> = ({ defaultNom = "", defaultPrenom = "", defaultDob = "", onAdd }) => {
  const refTitre = useRef<HTMLSelectElement>(null);
  const refNom = useRef<HTMLInputElement>(null);
  const refPrenom = useRef<HTMLInputElement>(null);
  const refDob = useRef<HTMLInputElement>(null);
  const refEmail = useRef<HTMLInputElement>(null);
  const refCurateur = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    const titre = (refTitre.current?.value as "M." | "Mme") || "M.";
    const nom = (refNom.current?.value || "").trim().toUpperCase();
    const prenom = (refPrenom.current?.value || "").trim();
    const dob = normalizeIsoDate(refDob.current?.value || "");
    const email = refEmail.current?.value || "";
    const curateur = !!refCurateur.current?.checked;
    if (!nom || !prenom || !dob) return;
    onAdd({ titre, nom, prenom, dateNaissance: dob, email, curateur });
  };

  return (
    <div className="mt-3 rounded-md border p-3 bg-slate-50 dark:bg-neutral-800">
      <div className="text-xs font-medium mb-2">Saisie minimale (adulte)</div>
      <div className="grid md:grid-cols-6 gap-2">
        <select ref={refTitre} className="border px-2 h-9 rounded text-sm" defaultValue="M.">
          <option value="M.">♂️ M</option>
          <option value="Mme">♀️ F</option>
        </select>
        <input ref={refNom} className="border px-2 h-9 rounded text-sm md:col-span-2" placeholder="NOM" defaultValue={defaultNom} />
        <input ref={refPrenom} className="border px-2 h-9 rounded text-sm md:col-span-2" placeholder="Prénom" defaultValue={defaultPrenom} />
        <input ref={refDob} type="date" className="border px-2 h-9 rounded text-sm" defaultValue={defaultDob} title="YYYY-MM-DD" />
      </div>

      <div className="grid md:grid-cols-3 gap-2 mt-2 items-center">
        <input ref={refEmail} className="border px-2 h-9 rounded text-sm md:col-span-2" placeholder="Email (optionnel)" />
        <label className="inline-flex items-center gap-2 text-sm px-2">
          <input ref={refCurateur} type="checkbox" className="h-4 w-4" />
          <ShieldCheck className="h-4 w-4" /> Curateur
        </label>
      </div>

      <div className="mt-2">
        <button type="button" className="h-8 px-3 rounded border text-sm" onClick={handleAdd}>
          Ajouter
        </button>
      </div>
    </div>
  );
};

export default EntryMinimalForm;
