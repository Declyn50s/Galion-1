import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const data = [
  { ref: 'R-2025-014', usager: 'MARTIN Jean', objet: 'Refus allocation logement', dateDepot: '28.08.2025', statut: 'À instruire' },
  { ref: 'R-2025-015', usager: 'DUPONT Marie', objet: 'Révision décision',         dateDepot: '30.08.2025', statut: 'En cours' },
];

const RecoursReclamationsList: React.FC = () => (
  <Card>
    <CardContent className="p-4 overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-100 uppercase text-xs text-gray-600">
          <tr>
            <th className="p-2">Référence</th>
            <th className="p-2">Usager</th>
            <th className="p-2">Objet</th>
            <th className="p-2">Date de dépôt</th>
            <th className="p-2">Statut</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r, i) => (
            <tr key={i} className="border-b hover:bg-gray-50">
              <td className="p-2">{r.ref}</td>
              <td className="p-2">{r.usager}</td>
              <td className="p-2">{r.objet}</td>
              <td className="p-2">{r.dateDepot}</td>
              <td className="p-2">{r.statut}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </CardContent>
  </Card>
);

export default RecoursReclamationsList;
