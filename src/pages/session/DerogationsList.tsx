import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const data = [
  { ref: 'D-2025-002', type: 'Plafond revenu', usager: 'KELLER Sofia', motif: 'Situation exceptionnelle', date: '20.08.2025', statut: 'Soumise' },
  { ref: 'D-2025-003', type: 'Surface min.',   usager: 'NGUYEN Paul',  motif: 'Famille recomposée',     date: '29.08.2025', statut: 'Approuvée' },
];

const DerogationsList: React.FC = () => (
  <Card>
    <CardContent className="p-4 overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-100 uppercase text-xs text-gray-600">
          <tr>
            <th className="p-2">Référence</th>
            <th className="p-2">Type</th>
            <th className="p-2">Usager</th>
            <th className="p-2">Motif</th>
            <th className="p-2">Date</th>
            <th className="p-2">Statut</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r, i) => (
            <tr key={i} className="border-b hover:bg-gray-50">
              <td className="p-2">{r.ref}</td>
              <td className="p-2">{r.type}</td>
              <td className="p-2">{r.usager}</td>
              <td className="p-2">{r.motif}</td>
              <td className="p-2">{r.date}</td>
              <td className="p-2">{r.statut}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </CardContent>
  </Card>
);

export default DerogationsList;
