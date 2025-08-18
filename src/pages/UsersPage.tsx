// src/pages/UsersPage.tsx
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
// import UserProfile from '@/components/UserProfile'; // garde-le si tu l'utilises

const peopleData = [
  { genre:"♀️ F", nom:"DUPONT", prenom:"Marie", dateNaissance:"01.01.1985", adresse:"Rue des Lilas 12", complement:"Appartement 3", npa:"1000", ville:"Lausanne", llm:true,  statut:"Actif" },
  { genre:"♂️ M", nom:"MARTIN", prenom:"Jean",  dateNaissance:"12.05.1990", adresse:"Avenue du Rhône 24", complement:"",            npa:"1200", ville:"Genève",   llm:false, statut:"Inactif" },
];

const statutColors: Record<string, string> = {
  Actif: "bg-green-500",
  Inactif: "bg-gray-400",
  "À vérifier": "bg-orange-400",
  Bloqué: "bg-red-500",
};

export const UsersPage: React.FC = () => {
  const [search, setSearch] = useState("");

  const filteredPeople = peopleData.filter((p) => {
    const s = search.toLowerCase();
    return (
      p.nom.toLowerCase().includes(s) ||
      p.prenom.toLowerCase().includes(s) ||
      p.ville.toLowerCase().includes(s) ||
      p.statut.toLowerCase().includes(s)
    );
  });

  return (
    <div className="p-6 space-y-4">
      <div className="relative w-full max-w-md">
        <Search className="absolute left-2.5 top-2.5 h-5 w-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Rechercher..."
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
                <th className="p-2">Genre</th>
                <th className="p-2">Nom</th>
                <th className="p-2">Prénom</th>
                <th className="p-2">Date de naissance</th>
                <th className="p-2">Adresse</th>
                <th className="p-2">NPA</th>
                <th className="p-2">Ville</th>
                <th className="p-2">LLM</th>
                <th className="p-2">Statut</th>
              </tr>
            </thead>
            <tbody>
              {filteredPeople.map((person, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="p-2">{person.genre}</td>
                  <td className="p-2 uppercase">{person.nom}</td>
                  <td className="p-2">{person.prenom}</td>
                  <td className="p-2">{person.dateNaissance}</td>
                  <td className="p-2">
                    {person.adresse}
                    {person.complement && (
                      <div className="text-xs text-gray-500">{person.complement}</div>
                    )}
                  </td>
                  <td className="p-2">{person.npa}</td>
                  <td className="p-2">{person.ville}</td>
                  <td className="p-2">
                    <span
                      className={`inline-block w-3 h-3 rounded-full ${
                        person.llm ? "bg-green-500" : "bg-gray-300"
                      }`}
                      title={person.llm ? "LLM activé" : "LLM désactivé"}
                    />
                  </td>
                  <td className="p-2">
                    <Badge className={`${statutColors[person.statut]} text-white`}>
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
